const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { publicUrl, removeObject } = require('../../utils/storage');

const prisma = new PrismaClient();

/**
 * The media library.
 *
 * Uploads already went to object storage; nothing recorded that they existed,
 * so there was nothing to browse and putting an image on a page meant hosting
 * it somewhere else and pasting a URL. This is the index that closes that gap.
 *
 * The row is a pointer, not the file. Deleting one removes the object too,
 * because a bucket nobody can list is a bucket that only grows.
 */

/** What the client needs: the row plus the URL to actually use. */
const shape = (asset) => ({
  id: asset.id,
  storageKey: asset.storageKey,
  url: publicUrl(asset.storageKey),
  originalName: asset.originalName,
  mimeType: asset.mimeType,
  sizeBytes: asset.sizeBytes,
  altText: asset.altText,
  createdAt: asset.createdAt,
  uploadedBy: asset.uploadedBy
    ? `${asset.uploadedBy.firstName || ''} ${asset.uploadedBy.lastName || ''}`.trim()
    : null,
});

const INCLUDE = { uploadedBy: { select: { firstName: true, lastName: true } } };

// GET /admin/media
const listMedia = async (req, res) => {
  try {
    const { search } = req.query;
    const where = search
      ? {
          OR: [
            { originalName: { contains: search, mode: 'insensitive' } },
            { altText: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const assets = await prisma.mediaAsset.findMany({
      where,
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return res.json({
      success: true,
      message: 'Media retrieved',
      data: assets.map(shape),
    });
  } catch (error) {
    console.error('listMedia error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /admin/media  (multipart, field: files)
 *
 * The upload middleware has already put the bytes in storage and set
 * `filename` to the key by the time this runs; all that is left is recording
 * what landed. Several files at once, because dragging a folder in is the
 * normal way to fill a library.
 */
const uploadMedia = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({ success: false, message: req.fileValidationError });
    }

    const files = req.files
      ? Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat()
      : req.file
      ? [req.file]
      : [];

    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files were uploaded' });
    }

    const created = [];
    for (const file of files) {
      const asset = await prisma.mediaAsset.create({
        data: {
          storageKey: file.filename,
          originalName: file.originalname?.slice(0, 255) || null,
          mimeType: file.mimetype || null,
          sizeBytes: Number.isFinite(file.size) ? file.size : null,
          uploadedById: req.user?.id || null,
        },
        include: INCLUDE,
      });
      created.push(shape(asset));
    }

    return res.status(201).json({
      success: true,
      message: `${created.length} file${created.length === 1 ? '' : 's'} uploaded`,
      data: created,
    });
  } catch (error) {
    console.error('uploadMedia error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateSchema = z.object({
  altText: z.string().max(255, 'Alt text is too long').optional().nullable(),
});

// PATCH /admin/media/:id — alt text, the only thing worth editing after upload
const updateMedia = async (req, res) => {
  try {
    const data = updateSchema.parse(req.body || {});
    if (data.altText !== undefined) {
      data.altText = String(data.altText ?? '').trim() || null;
    }
    const asset = await prisma.mediaAsset.update({
      where: { id: req.params.id },
      data,
      include: INCLUDE,
    });
    return res.json({ success: true, message: 'Saved', data: shape(asset) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.errors.map((e) => e.message).join('; ');
      return res.status(400).json({ success: false, message: `Validation error — ${detail}` });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    console.error('updateMedia error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /admin/media/:id
 *
 * Removes the object as well as the row. Nothing here tracks which pages use
 * an image, so a page pointing at it will show a broken image afterwards —
 * the response says which pages mention the URL, so that is a decision rather
 * than a surprise.
 */
const deleteMedia = async (req, res) => {
  try {
    const asset = await prisma.mediaAsset.findUnique({ where: { id: req.params.id } });
    if (!asset) {
      return res.json({ success: true, message: 'File already removed' });
    }

    const url = publicUrl(asset.storageKey);
    const usedBy = await prisma.customPage.findMany({
      where: {
        OR: [
          { htmlContent: { contains: asset.storageKey } },
          { featuredImageUrl: { contains: asset.storageKey } },
        ],
      },
      select: { title: true, slug: true },
    });

    await removeObject(asset.storageKey).catch((e) =>
      console.error('media object removal failed:', e.message)
    );
    await prisma.mediaAsset.delete({ where: { id: asset.id } });

    return res.json({
      success: true,
      message: usedBy.length
        ? `Deleted — but ${usedBy.length} ${
            usedBy.length === 1 ? 'page still references' : 'pages still reference'
          } it`
        : 'Deleted',
      data: { url, usedBy },
    });
  } catch (error) {
    console.error('deleteMedia error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { listMedia, uploadMedia, updateMedia, deleteMedia };
