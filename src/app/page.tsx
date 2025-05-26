
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MainHeader } from "@/components/layout/MainHeader";
import { AppLogo } from '@/components/layout/AppLogo';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getLandingPageContentAction } from "@/lib/actions/admin-settings-actions";
import type { LandingPageContent, HeroSectionContent, FeaturesOverviewContent, FeatureItem, AccountOfferingsContent, AccountOfferingItem, DebitCardPromotionContent, InvestmentOpportunitiesContent, LoanMortgageServicesContent, CustomerFeedbackContent, FinalCTAContent, NavLinkItem, FooterContent, FooterLinkColumn, SocialMediaLink } from "@/types";
import {
  ArrowRight, ShieldCheck, Users, MessageCircle, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin, CreditCard,
  Smartphone, Activity, TrendingUp, DollarSign, FileText, Landmark, Repeat, Clock, UserCheck, BarChartBig, RefreshCw, Send,
  FilePieChart, Library, Coins, HandCoins, PiggyBank, University, CircleDollarSign, Building2, Handshake, User, Headphones,
  BookOpen, Info, Briefcase, Home, HeartHandshake, Building, Download, GitCompareArrows, Search, Eye, Settings, Banknote,
  Globe, BadgePercent, Receipt, BarChart, Layers3, Shield, Zap, TabletSmartphone, Waypoints, Wallet, Target,
  BriefcaseBusiness, GraduationCap, Scale, Lightbulb, Component, Award, LifeBuoy
} from "lucide-react";


// --- Fallback Content ---
const defaultHeroContent: HeroSectionContent = {
  headline: "Take total control of your finances",
  subheading: "Experience banking designed for the digital age with excellent customer service, tailored to your unique needs.",
  ctaButtonText: "Open a Wohana Account",
  ctaButtonLink: "/register",
  learnMoreLink: "#features",
  imageUrl: "https://images.pexels.com/photos/7680637/pexels-photo-7680637.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", // Example high-res image
  imageAlt: "Modern digital banking interface"
};

const defaultFeaturesOverviewContent: FeaturesOverviewContent = {
  headline: "Banking at Your Fingertips",
  subheading: "Enjoy seamless and secure banking with features designed to make your financial life easier and more efficient.",
  features: [
    { icon: "Send", title: "Seamless Funds Transfer", description: "Effortlessly move money locally and internationally." },
    { icon: "Activity", title: "Real-time Balance Monitoring", description: "Stay updated with your account activities instantly." },
    { icon: "CreditCard", title: "Card & Cheque Management", description: "Full control over your cards and cheque books." },
    { icon: "FileText", title: "Comprehensive Account Management", description: "Manage all your account details in one place." },
    { icon: "Receipt", title: "Easy Bills Payment", description: "Pay your bills quickly and conveniently." },
    { icon: "Headphones", title: "24/7 Expert Support", description: "Our dedicated team is always here to help you." },
  ],
};

const defaultAccountOfferingsContent: AccountOfferingsContent = {
  headline: "Accounts Designed for Your Needs",
  subheading: "Choose the perfect account type that suits your lifestyle and financial goals.",
  accounts: [
    { icon: "Landmark", name: "Wohana Domiciliary Account", description: "Access foreign currencies and make international transactions with ease.", features: ["Multi-currency holding", "Competitive FX rates", "Global access"], learnMoreLink: "#domiciliary" },
    { icon: "GraduationCap", name: "Wohana Kiddies Account", description: "Secure your child's future with our dedicated savings account for young ones.", features: ["Bonus interest", "Financial literacy tools", "Parental controls"], learnMoreLink: "#kiddies" },
    { icon: "PiggyBank", name: "Wohana Savings Account", description: "Grow your savings with attractive interest rates and flexible access.", features: ["High interest rates", "No minimum balance", "Easy access"], learnMoreLink: "#savings" },
    { icon: "User", name: "Individual Current Account", description: "Manage your day-to-day finances efficiently with our feature-rich current account.", features: ["Overdraft facility", "Cheque book", "Online banking"], learnMoreLink: "#current" },
  ],
};

const defaultWhyWohanaContent = {
    headline: "Why Choose Wohana Funds?",
    subheading: "Experience banking that puts you first with our commitment to innovation, security, and customer satisfaction.",
    reasons: [
      { iconName: "Shield", title: "Robust Security", description: "Bank with confidence knowing your data and funds are protected by state-of-the-art security measures and fraud prevention systems." },
      { iconName: "Settings", title: "Tailored Solutions", description: "From personal accounts to business financing, we offer products and services designed to meet your unique financial needs and goals." },
      { iconName: "Zap", title: "Seamless Digital Experience", description: "Manage your finances effortlessly with our intuitive mobile app and online banking portal, available 24/7." },
      { iconName: "HandCoins", title: "Transparent Banking", description: "No hidden fees, just clear and straightforward banking. We believe in honesty and clarity in all our dealings." },
    ]
};

const defaultDebitCardPromotionContent: DebitCardPromotionContent = {
  headline: "TAP. SWIPE. PIN.",
  description: "Enjoy safe and convenient banking anytime, anywhere with Wohana Debit Cards. Access your funds globally, shop online securely, and manage your card with ease right from our app.",
  imageUrl: "https://placehold.co/600x450/002147/FFD700.png?text=Debit+Card+User",
  imageAlt: "Customer using Wohana Debit Card",
  ctaButtonText: "Get Your Card",
  ctaButtonLink: "/register"
};

const defaultInvestmentOpportunitiesContent: InvestmentOpportunitiesContent = {
  headline: "We don't tell fortunes, we make them for you.",
  description: "Invest with Wohana and enjoy higher interest rates on your fixed deposits. Explore a range of investment options designed to help you build wealth.",
  ctaButtonText: "View Investment Options",
  ctaButtonLink: "/login",
  imageUrl: "https://placehold.co/700x500/002147/FFD700.png?text=Invest+Growth",
  imageAlt: "Symbol of investment growth with coins and upward graph"
};

const defaultLoanMortgageServicesContent: LoanMortgageServicesContent = {
  headline: "Personal Loans made for life's twists and turns.",
  description: "Flexible loan options to meet your personal and business needs. Get quick approvals and competitive rates to achieve your goals.",
  ctaButtonText: "Learn More",
  ctaButtonLink: "#loans",
  imageUrl: "https://placehold.co/1200x600/cccccc/002147.png?text=Happy+Family",
  imageAlt: "Happy family achieving goals with a loan"
};

const defaultCustomerFeedbackContent: CustomerFeedbackContent = {
  headline: "Your feedback helps us serve you better.",
  ctaButtonText: "Send Feedback",
  ctaButtonLink: "#contact-us"
};

const defaultFinalCTAContent: FinalCTAContent = {
  headline: "Ready to transform your banking experience?",
  subheading: "Join Wohana Funds today. Open an account in minutes and experience banking that truly understands you.",
  ctaButtonText: "Open an Account Now",
  ctaButtonLink: "/register"
};

const defaultHeaderNavLinks: NavLinkItem[] = [
  { label: "Personal", href: "#personal-accounts" },
  { label: "Business", href: "#business-accounts" }, // Placeholder, as we don't have a specific "Business Accounts" section yet
  { label: "About Us", href: "#about-wohana" },
  { label: "Help & Support", href: "#contact-us" },
];

const defaultFooterContent: FooterContent = {
  footerDescription: "Wohana Funds is your trusted partner for modern banking solutions. Secure, innovative, and customer-focused.",
  footerCopyright: `© ${new Date().getFullYear()} Wohana Funds. All rights reserved. Licensed by the Central Bank.`,
  footerQuickLinkColumns: [
    { title: "Company", links: [ {label: "About Us", href: "#about-wohana"}, {label: "Careers", href: "#"}, {label: "Press", href: "#"} ] },
    { title: "Products", links: [ {label: "Savings Accounts", href: "#personal-accounts"}, {label: "Current Accounts", href: "#personal-accounts"}, {label: "Loans", href: "#loans"}, {label: "Investments", href: "#investments"} ] },
    { title: "Legal", links: [ {label: "Privacy Policy", href: "/privacy"}, {label: "Terms & Conditions", href: "/terms"} ] },
    { title: "Support", links: [ {label: "FAQs", href: "#contact-us"}, {label: "Contact Us", href: "#contact-us"}, {label: "Security Center", href: "#"} ] },
  ],
  footerSocialMediaLinks: [
    { platform: "Facebook", href: "https://facebook.com/wohanafunds", iconName: "Facebook" },
    { platform: "Twitter", href: "https://twitter.com/wohanafunds", iconName: "Twitter" },
    { platform: "Instagram", href: "https://instagram.com/wohanafunds", iconName: "Instagram" },
    { platform: "Linkedin", href: "https://linkedin.com/company/wohanafunds", iconName: "Linkedin" },
  ],
  contactInfo: {
    address: "123 Wohana Street, Finance City, FC 12345",
    phone: "+1 (800) 555-0199",
    email: "support@wohanafunds.com"
  }
};

// Lucide Icon Resolver
const LucideIconsMap: Record<string, React.ElementType> = {
  Send, Activity, CreditCard, UserCheck, FileText, PiggyBank, User, Globe, Landmark, Library, FilePieChart, Repeat, Smartphone, Clock, Waypoints, Home, Building, Facebook, Twitter, Instagram, Linkedin, ShieldCheck, BarChartBig, DollarSign, MessageCircle, Phone, Mail, MapPin, Component, Layers3, Shield, Zap, TabletSmartphone, Wallet, Target,
  BriefcaseBusiness, GraduationCap, Scale, Lightbulb, Coins, HandCoins, University, CircleDollarSign, Building2, Handshake, Headphones, BookOpen, Info, Briefcase, HeartHandshake, Download, GitCompareArrows, Search, Eye, Settings, Banknote, BadgePercent, Receipt, BarChart, ArrowRight, Users, TrendingUp, Award, LifeBuoy,
  Cog: Settings, // Map "Cog" string to Settings icon
  Default: Component, // Fallback icon
};

const LucideIcon = ({ name, className }: { name?: string; className?: string }) => {
  if (!name) return <LucideIconsMap.Default className={className || "h-6 w-6"} />;
  const IconComponent = LucideIconsMap[name] || LucideIconsMap.Default;
  return <IconComponent className={className || "h-6 w-6"} />;
};


export default async function HomePage() {
  let landingPageContentData: LandingPageContent = {};
  try {
    const result = await getLandingPageContentAction();
    if (result.success && result.content) {
      landingPageContentData = result.content;
    } else {
      landingPageContentData = { // Use all defaults if fetch fails or content is empty
        heroSection: defaultHeroContent,
        featuresOverview: defaultFeaturesOverviewContent,
        accountOfferings: defaultAccountOfferingsContent,
        debitCardPromotion: defaultDebitCardPromotionContent,
        investmentOpportunities: defaultInvestmentOpportunitiesContent,
        loanMortgageServices: defaultLoanMortgageServicesContent,
        customerFeedback: defaultCustomerFeedbackContent,
        finalCTA: defaultFinalCTAContent,
        headerNavLinks: defaultHeaderNavLinks,
        footerContent: defaultFooterContent,
      };
    }
  } catch (error) {
    console.error("Failed to fetch landing page content on server, using all defaults:", error);
    landingPageContentData = {
        heroSection: defaultHeroContent,
        featuresOverview: defaultFeaturesOverviewContent,
        accountOfferings: defaultAccountOfferingsContent,
        debitCardPromotion: defaultDebitCardPromotionContent,
        investmentOpportunities: defaultInvestmentOpportunitiesContent,
        loanMortgageServices: defaultLoanMortgageServicesContent,
        customerFeedback: defaultCustomerFeedbackContent,
        finalCTA: defaultFinalCTAContent,
        headerNavLinks: defaultHeaderNavLinks,
        footerContent: defaultFooterContent,
    };
  }

  const currentHero = landingPageContentData.heroSection || defaultHeroContent;
  const currentFeaturesOverview = landingPageContentData.featuresOverview || defaultFeaturesOverviewContent;
  const currentAccountOfferings = landingPageContentData.accountOfferings || defaultAccountOfferingsContent;
  const currentWhyWohana = defaultWhyWohanaContent;
  const currentDebitCardPromotion = landingPageContentData.debitCardPromotion || defaultDebitCardPromotionContent;
  const currentInvestmentOpportunities = landingPageContentData.investmentOpportunities || defaultInvestmentOpportunitiesContent;
  const currentLoanMortgageServices = landingPageContentData.loanMortgageServices || defaultLoanMortgageServicesContent;
  const currentCustomerFeedback = landingPageContentData.customerFeedback || defaultCustomerFeedbackContent;
  const currentFinalCTA = landingPageContentData.finalCTA || defaultFinalCTAContent;
  const currentHeaderNavLinks = landingPageContentData.headerNavLinks && landingPageContentData.headerNavLinks.length > 0 ? landingPageContentData.headerNavLinks : defaultHeaderNavLinks;
  const currentFooter = landingPageContentData.footerContent || defaultFooterContent;


  const features = currentFeaturesOverview.features && currentFeaturesOverview.features.length > 0 ? currentFeaturesOverview.features : defaultFeaturesOverviewContent.features || [];
  const accountTypes = currentAccountOfferings.accounts && currentAccountOfferings.accounts.length > 0 ? currentAccountOfferings.accounts : defaultAccountOfferingsContent.accounts || [];

  const investmentProducts = [
    { iconName: "Landmark", name: "Fixed Deposits", description: "Lock in funds for a fixed term and enjoy guaranteed high returns with attractive interest rates." },
    { iconName: "Library", name: "Treasury Bills", description: "Invest in short-term, secure government-backed securities for stable returns and capital preservation." },
    { iconName: "FilePieChart", name: "Bonds", description: "Diversify your portfolio with corporate and government bonds offering fixed income potential over various terms." },
    { iconName: "Repeat", name: "Forex Market", description: "Trade currencies and leverage global market movements for potential profits. (High risk)" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-body">
      <MainHeader navLinks={currentHeaderNavLinks} />
      <main className="flex-1">
        {/* Hero Section */}
        <section id="hero" className="relative py-20 md:py-32 bg-gradient-to-br from-primary to-blue-700 text-primary-foreground">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
          <div className="container relative z-10 mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-heading">
                  {currentHero.headline}
                </h1>
                <p className="text-lg md:text-xl text-primary-foreground/90 mb-10 max-w-xl mx-auto md:mx-0">
                  {currentHero.subheading}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Button size="lg" className="bg-secondary text-primary-foreground hover:bg-secondary/90 shadow-lg px-8 py-3 text-lg font-semibold rounded-md" asChild>
                    <Link href={currentHero.ctaButtonText === "Open a Wohana Account" ? "/register" : (currentHero.ctaButtonLink || "/register")}>{currentHero.ctaButtonText}</Link>
                  </Button>
                  <Button
                    size="lg"
                    className="bg-white text-primary hover:bg-gray-100 border border-primary px-8 py-3 text-lg font-semibold rounded-md"
                    asChild
                  >
                    <Link href={currentHero.learnMoreLink || "#features"}>Learn More</Link>
                  </Button>
                </div>
              </div>
              <div className="relative aspect-[4/5] sm:aspect-video md:aspect-[4/3] rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src={currentHero.imageUrl}
                  alt={currentHero.imageAlt}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 767px) 100vw, 50vw"
                  data-ai-hint="modern finance app"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Overview */}
        <section id="features" className="py-16 md:py-20 lg:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3 font-heading">
                {currentFeaturesOverview.headline}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {currentFeaturesOverview.subheading}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="bg-card p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow text-center flex flex-col items-center">
                  <div className="p-4 bg-primary/10 rounded-full mb-5 inline-block">
                     <LucideIcon name={feature.icon} className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground mb-2 font-heading">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Account Offerings */}
        <section id="personal-accounts" className="py-16 md:py-20 lg:py-24 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3 font-heading">
                 {currentAccountOfferings.headline}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {currentAccountOfferings.subheading}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {accountTypes.map((account) => (
                <div key={account.name} className="bg-card p-6 rounded-xl shadow-lg flex flex-col transition-all hover:shadow-xl hover:-translate-y-1">
                  <div className="flex items-center mb-4">
                    <LucideIcon name={account.icon} className="h-7 w-7 text-primary" />
                    <h3 className="text-lg font-semibold text-card-foreground ml-3 font-heading">{account.name}</h3>
                  </div>
                  <p className="text-muted-foreground mb-4 text-sm flex-grow">{account.description}</p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground mb-6 list-disc pl-5 flex-grow">
                    {(Array.isArray(account.features) ? account.features : []).map(feat => <li key={feat}>{feat}</li>)}
                  </ul>
                  <Button variant="link" className="text-secondary p-0 self-start hover:text-secondary/90 font-semibold group mt-auto" asChild>
                    <Link href={account.learnMoreLink || "#"}>Learn More <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" /></Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Why Choose Wohana Funds? Section */}
        <section id="about-wohana" className="py-16 md:py-20 lg:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3 font-heading">{currentWhyWohana.headline}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {currentWhyWohana.subheading}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {currentWhyWohana.reasons.map((item) => (
                <div key={item.title} className="bg-card p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow text-left">
                  <div className="p-3 bg-secondary/10 rounded-full mb-4 inline-block">
                    <LucideIcon name={item.iconName} className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground mb-2 font-heading">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Debit Card Promotion */}
        <section id="debit-card" className="py-16 md:py-20 lg:py-24 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4 font-heading">
                  {currentDebitCardPromotion.headline}
                </h2>
                <p className="text-muted-foreground mb-6 text-lg">
                  {currentDebitCardPromotion.description}
                </p>
                {/* Logos removed as per user request */}
                <Button className="btn-gold shadow-md px-8 font-semibold rounded-md" asChild>
                  <Link href={currentDebitCardPromotion.ctaButtonLink || "/register"}>
                    {currentDebitCardPromotion.ctaButtonText}
                  </Link>
                </Button>
              </div>
              <div className="relative aspect-square sm:aspect-video md:aspect-[4/3] rounded-lg overflow-hidden shadow-xl">
                <Image
                  src={currentDebitCardPromotion.imageUrl}
                  alt={currentDebitCardPromotion.imageAlt}
                  fill
                  className="object-cover"
                  data-ai-hint="customer card payment"
                  sizes="(max-width: 639px) 100vw, (max-width: 767px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Investment Opportunities */}
        <section id="investments" className="py-16 md:py-20 lg:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">
              {currentInvestmentOpportunities.headline}
            </h2>
            <p className="text-primary-foreground/80 mb-12 md:mb-16 max-w-2xl mx-auto text-lg">
              {currentInvestmentOpportunities.description}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {investmentProducts.map((product) => (
                <div key={product.name} className="bg-card/10 backdrop-blur-sm p-6 rounded-lg shadow-lg text-left flex flex-col">
                   <div className="flex items-center mb-3">
                     <LucideIcon name={product.iconName} className="h-7 w-7 text-secondary" />
                     <h3 className="text-lg font-semibold text-primary-foreground ml-2 font-heading">{product.name}</h3>
                  </div>
                  <p className="text-sm text-primary-foreground/70 mb-4 font-body flex-grow">{product.description}</p>
                  <Button variant="link" className="text-secondary p-0 font-semibold hover:text-secondary/80 group self-start mt-auto" asChild>
                    <Link href="/login">INVEST WITH US NOW <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" /></Link>
                  </Button>
                </div>
              ))}
            </div>
             <div className="relative aspect-video max-w-3xl mx-auto rounded-lg overflow-hidden shadow-xl mb-12">
                <Image
                    src={currentInvestmentOpportunities.imageUrl}
                    alt={currentInvestmentOpportunities.imageAlt}
                    fill
                    className="object-cover"
                    data-ai-hint="investment growth graph"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 700px"
                />
            </div>
            <Button size="lg" className="bg-secondary text-primary-foreground hover:bg-secondary/90 shadow-md px-8 font-semibold rounded-md" asChild>
              <Link href={currentInvestmentOpportunities.ctaButtonLink || "#investments"}>
                {currentInvestmentOpportunities.ctaButtonText}
              </Link>
            </Button>
          </div>
        </section>

        {/* Loan & Mortgage Services */}
        <section id="loans" className="py-16 md:py-20 lg:py-24 bg-muted/30">
            <div className="container mx-auto px-4">
                 <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3 font-heading">
                        {currentLoanMortgageServices.headline}
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {currentLoanMortgageServices.description}
                    </p>
                </div>
                <div className="grid md:grid-cols-2 gap-12 items-start">
                    <div className="bg-card p-8 rounded-xl shadow-lg">
                        <User className="h-10 w-10 text-secondary mb-4"/>
                        <h3 className="text-2xl font-semibold text-primary mb-3 font-heading">Personal Loans</h3>
                        <p className="text-muted-foreground mb-6">Flexible loan options to meet your personal needs, helping you achieve your dreams and navigate unexpected expenses.</p>
                        <ul className="space-y-2 text-sm text-muted-foreground mb-6 list-disc pl-5">
                            <li>Competitive interest rates</li>
                            <li>Quick approval process</li>
                            <li>Flexible repayment terms</li>
                        </ul>
                        <Button className="btn-gold shadow-md font-semibold rounded-md" asChild>
                            <Link href={currentLoanMortgageServices.ctaButtonLink || "#loans"}>Apply Now</Link>
                        </Button>
                    </div>
                     <div className="bg-card p-8 rounded-xl shadow-lg">
                        <Home className="h-10 w-10 text-secondary mb-4"/>
                        <h3 className="text-2xl font-semibold text-primary mb-3 font-heading">Mortgage Loans</h3>
                        <p className="text-muted-foreground mb-6">Secure the keys to your dream home with our tailored mortgage solutions and expert guidance through every step.</p>
                         <ul className="space-y-2 text-sm text-muted-foreground mb-6 list-disc pl-5">
                            <li>Attractive mortgage rates</li>
                            <li>Variety of loan tenures</li>
                            <li>Dedicated mortgage advisors</li>
                        </ul>
                        <Button className="btn-gold shadow-md font-semibold rounded-md" asChild>
                            <Link href={currentLoanMortgageServices.ctaButtonLink || "#loans"}>Apply Now</Link>
                        </Button>
                    </div>
                </div>
                 <div className="mt-12 relative aspect-square sm:aspect-video md:aspect-[4/3] rounded-lg overflow-hidden shadow-2xl max-w-5xl mx-auto">
                     <Image
                        src={currentLoanMortgageServices.imageUrl}
                        alt={currentLoanMortgageServices.imageAlt}
                        fill
                        className="object-cover"
                        data-ai-hint="happy customer loan"
                        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 100vw, 1200px"
                     />
                </div>
            </div>
        </section>
        
        {/* Customer Feedback */}
        <section id="contact-us" className="py-16 md:py-20 lg:py-24 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3 font-heading">
                {currentCustomerFeedback.headline}
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Have questions or need assistance? Our dedicated support team is ready to help you.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <div className="flex items-start">
                  <Phone className="h-7 w-7 text-secondary mr-4 mt-1 shrink-0"/>
                  <div>
                    <h4 className="text-xl font-semibold text-primary mb-1 font-heading">Call Us</h4>
                    <p className="text-muted-foreground">{currentFooter.contactInfo?.phone || defaultFooterContent.contactInfo?.phone}</p>
                    <p className="text-sm text-muted-foreground">Available 24/7 for urgent queries.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="h-7 w-7 text-secondary mr-4 mt-1 shrink-0"/>
                  <div>
                    <h4 className="text-xl font-semibold text-primary mb-1 font-heading">Email Us</h4>
                    <p className="text-muted-foreground">{currentFooter.contactInfo?.email || defaultFooterContent.contactInfo?.email}</p>
                    <p className="text-sm text-muted-foreground">We typically respond within 24 hours.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-7 w-7 text-secondary mr-4 mt-1 shrink-0"/>
                  <div>
                    <h4 className="text-xl font-semibold text-primary mb-1 font-heading">Visit Us</h4>
                    <p className="text-muted-foreground">{currentFooter.contactInfo?.address || defaultFooterContent.contactInfo?.address}</p>
                    <p className="text-sm text-muted-foreground">Mon - Fri: 9:00 AM - 5:00 PM</p>
                  </div>
                </div>
                 <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-primary-foreground font-semibold" asChild>
                    <Link href={currentCustomerFeedback.ctaButtonLink || defaultCustomerFeedbackContent.ctaButtonLink || "#"}>
                      {currentCustomerFeedback.ctaButtonText}
                    </Link>
                  </Button>
              </div>
              <div className="bg-card p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-semibold text-primary mb-4 font-heading">Send Us a Message</h3>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="font-medium">Full Name</Label>
                    <Input type="text" id="name" placeholder="John Doe" className="mt-1"/>
                  </div>
                  <div>
                    <Label htmlFor="email" className="font-medium">Email Address</Label>
                    <Input type="email" id="email" placeholder="you@example.com" className="mt-1"/>
                  </div>
                  <div>
                    <Label htmlFor="subject" className="font-medium">Subject</Label>
                    <Input type="text" id="subject" placeholder="Regarding..." className="mt-1"/>
                  </div>
                  <div>
                    <Label htmlFor="message" className="font-medium">Message</Label>
                    <Textarea id="message" rows={4} placeholder="Your message..." className="mt-1"/>
                  </div>
                  <Button type="submit" className="w-full bg-secondary text-primary-foreground hover:bg-secondary/90 font-semibold">Send Message</Button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section id="final-cta" className="py-16 md:py-20 lg:py-24 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4 font-heading">
                {currentFinalCTA.headline}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-lg">
                {currentFinalCTA.subheading}
            </p>
            <Button size="lg" className="btn-gold shadow-lg px-10 py-3 text-lg font-semibold rounded-md" asChild>
              <Link href={currentFinalCTA.ctaButtonLink || "/register"}>
                {currentFinalCTA.ctaButtonText}
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-primary-foreground pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,_1fr)] gap-10 mb-12">
            <div className="md:col-span-2 lg:col-span-1">
              <AppLogo />
              <p className="mt-4 text-sm text-primary-foreground/70 leading-relaxed">
                {currentFooter.footerDescription || defaultFooterContent.footerDescription}
              </p>
              <div className="flex space-x-4 mt-6">
                {(currentFooter.footerSocialMediaLinks && currentFooter.footerSocialMediaLinks.length > 0 ? currentFooter.footerSocialMediaLinks : defaultFooterContent.footerSocialMediaLinks || []).map(social => (
                  <Link key={social.platform} href={social.href || "#"} aria-label={social.platform} target="_blank" rel="noopener noreferrer" className="text-primary-foreground/70 hover:text-secondary">
                    <LucideIcon name={social.iconName || social.platform} className="h-6 w-6" />
                  </Link>
                ))}
              </div>
            </div>

            {(currentFooter.footerQuickLinkColumns && currentFooter.footerQuickLinkColumns.length > 0 ? currentFooter.footerQuickLinkColumns : defaultFooterContent.footerQuickLinkColumns || []).slice(0,3).map((column) => (
              <div key={column.title}>
                <h5 className="text-lg font-semibold mb-4 text-secondary font-heading">{column.title}</h5>
                <ul className="space-y-3 text-sm">
                  {(column.links || []).map(link => (
                    <li key={link.label}><Link href={link.href || "#"} className="hover:text-secondary/90">{link.label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
            
          </div>
          <div className="border-t border-primary-foreground/20 pt-8 mt-8">
             <div className="flex flex-col md:flex-row justify-between items-center text-sm">
                <p className="text-primary-foreground/70 mb-4 md:mb-0">
                    {currentFooter.footerCopyright || defaultFooterContent.footerCopyright}
                </p>
                <form className="flex items-center space-x-2 w-full md:w-auto">
                    <Input type="email" placeholder="Enter your email" className="bg-primary/80 border-primary-foreground/30 placeholder:text-primary-foreground/50 text-sm h-9 w-full md:w-auto max-w-xs focus:ring-secondary rounded-md text-primary-foreground" />
                    <Button type="submit" size="sm" className="bg-secondary text-primary-foreground hover:bg-secondary/90 h-9 font-semibold rounded-md">Subscribe</Button>
                </form>
            </div>
            <div className="mt-6 text-center text-xs text-primary-foreground/60">
              <p>
                {(currentFooter.contactInfo?.address || defaultFooterContent.contactInfo?.address)} | 
                Email: {(currentFooter.contactInfo?.email || defaultFooterContent.contactInfo?.email)} | 
                Phone: {(currentFooter.contactInfo?.phone || defaultFooterContent.contactInfo?.phone)}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
