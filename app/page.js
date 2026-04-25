import PublicNav from '@/components/layout/PublicNav'
import PublicFooter from '@/components/layout/PublicFooter'
import HeroSection from '@/components/public/HeroSection'
import ServicesSection from '@/components/public/ServicesSection'
import WhyUsSection from '@/components/public/WhyUsSection'
import PricingSection from '@/components/public/PricingSection'
import CoverageSection from '@/components/public/CoverageSection'
import TestimonialsSection from '@/components/public/TestimonialsSection'
import GallerySection from '@/components/public/GallerySection'
import MembershipSection from '@/components/public/MembershipSection'
import CtaSection from '@/components/public/CtaSection'
export default function HomePage() {
  return (
    <>
      <PublicNav />
      <main>
        <HeroSection />
        <ServicesSection />
        <WhyUsSection />
        <PricingSection />
        <MembershipSection />
        <CoverageSection />
        <GallerySection />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <PublicFooter />
    </>
  )
}
