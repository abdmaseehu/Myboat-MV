/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      /**
       * The ferry page was at /bus-tickets — a name inherited from the script
       * this platform was built from, and visible in the address bar of a
       * boat-booking site.
       *
       * A permanent redirect rather than a rename, because that URL is already
       * out in the world: on printed e-tickets, in the embed snippets
       * operators have pasted into their own sites, and in anything anyone has
       * bookmarked or shared. Next carries the query string across, so a link
       * to a specific route and date still lands on the right departures.
       */
      {
        source: '/bus-tickets',
        destination: '/ferry',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
