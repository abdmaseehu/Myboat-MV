import Hero from '@/components/web/hero'
import Features from '@/components/web/features'
import Steps from '@/components/web/steps'
import SummerTrips from '@/components/web/summer-trips'
import WhyChooseUs from '@/components/web/why-choose-us'
import DriversTeam from '@/components/web/drivers-team'
import Stats from '@/components/web/stats'
import Testimonials from '@/components/web/testimonials'
import Blog from '@/components/web/blog'

export const metadata = {
  title: 'Myboat MV - Book Maldives Ferry & Speedboat Tickets',
  description: 'Book ferry, speedboat, and private charter tickets across the Maldives. Fast, reliable sea transport booking.',
  keywords: 'maldives ferry, speedboat booking, boat tickets, sea travel maldives, myboat',
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <Steps />
      <SummerTrips />
      <WhyChooseUs />
      <DriversTeam />
      <Stats />
      <Testimonials />
      <Blog />
    </>
  )
}
