"use client";

import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { ProjectsList } from "@/modules/home/ui/components/projects-list";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import { 
  ChevronDownIcon, 
  CheckIcon, 
  SparklesIcon, 
  CodeBracketIcon, 
  RocketLaunchIcon,
  BoltIcon,
  StarIcon
} from "@heroicons/react/24/outline";
import { CommunityProjects } from "@/modules/home/ui/components/CommunityProjects";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const FAQ_DATA = [
  {
    question: "What can I build with Devle?",
    answer: "You can create full-stack web applications, landing pages, dashboards, e-commerce sites, and more. Simply describe your idea in natural language and Devle's AI will generate the code and deploy it for you."
  },
  {
    question: "Do I need coding experience?",
    answer: "Not at all! Devle is designed for everyone. Whether you're a complete beginner or an experienced developer, you can build professional applications just by chatting with our AI."
  },
  {
    question: "How does the AI code generation work?",
    answer: "Our advanced AI understands your requirements and generates clean, production-ready code using modern frameworks like React, Next.js, and TypeScript. You can review, modify, and deploy the code instantly."
  },
  {
    question: "Can I customize the generated applications?",
    answer: "Absolutely! You have full control over the generated code. You can make changes through chat, direct code editing, or download the project to work on it locally."
  },
  {
    question: "What happens to my projects?",
    answer: "All your projects are saved to your account and can be accessed anytime. You can share them, collaborate with others, or export them to your own hosting platform."
  }
];

const PRICING_PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out Devle",
    features: [
      "5 credits per month",
      "Basic AI assistance",
      "Live app previews"
    ],
    buttonText: "Get Started",
    popular: false
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For serious builders and creators",
    features: [
      "100 credits per month",
      "Advanced AI features",
      "Priority support"
        ],
    buttonText: "Start Pro Trial",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "For teams and organizations",
    features: [
      "Everything in Pro",
      "Custom AI training",
      "Dedicated support",

    ],
    buttonText: "Contact Sales",
    popular: false
  }
];

const FAQItem = ({ faq, index }: { faq: typeof FAQ_DATA[0]; index: number }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border border-border rounded-lg overflow-hidden bg-card"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium text-foreground">{faq.question}</span>
        <ChevronDownIcon 
          className={`w-5 h-5 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-4 text-muted-foreground">
          {faq.answer}
        </div>
      </motion.div>
    </motion.div>
  );
};

const PricingCard = ({ plan, index }: { plan: typeof PRICING_PLANS[0]; index: number }) => {
  const { user } = useUser();

  return (
  
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.8 }}
      className={`relative rounded-2xl p-8 ${
        plan.popular 
          ? 'bg-gradient-to-b from-primary/10 to-primary/5 border-2 border-primary shadow-xl' 
          : 'bg-card border border-border'
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
        <div className="mb-2">
          <span className="text-4xl font-bold">{plan.price}</span>
          <span className="text-muted-foreground ml-1">/{plan.period}</span>
        </div>
        <p className="text-muted-foreground">{plan.description}</p>
      </div>

      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-center">
            <CheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        {user ? (
          <button className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
            plan.popular
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted hover:bg-muted/80 text-foreground'
          }`}>
            {plan.buttonText}
          </button>
        ) : (
          <SignUpButton mode="modal">
            <button className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
              plan.popular
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}>
              {plan.buttonText}
            </button>
          </SignUpButton>
        )}
      </div>
    </motion.div>
  );
};

const Page = () => {
  return (

    <div className="flex flex-col max-w-7xl mx-auto w-full">
      {/* Hero Section */}
      <section className="space-y-8 py-[12vh] 2xl:py-32 px-4">
        <motion.div 
          className="flex flex-col items-center space-y-8"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={fadeInUp}>
            <Image
              src="/logo.svg"
              alt="Devle"
              width={60}
              height={60}
              className="hidden md:block"
            />
          </motion.div>

          <motion.div variants={fadeInUp} className="text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              AI-Powered Development Platform
            </motion.div>
            
            <h1 className="text-4xl md:text-7xl font-bold text-center bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
              Build something
              <br />
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                extraordinary
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground text-center max-w-3xl">
              Create professional apps and websites by simply chatting with AI. 
              No coding required, unlimited possibilities.
            </p>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            className="max-w-4xl mx-auto w-full"
          >
            <ProjectForm />
          </motion.div>
        </motion.div>
      </section>
<div className="bg-background rounded-[1rem] border border-[#201E1C14]">

      {/* Features Section */}
      <motion.section 
        className="py-24 px-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Why developers choose Devle
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your ideas into reality with the power of AI-assisted development
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <BoltIcon className="w-8 h-8" />,
              title: "Lightning Fast",
              description: "Go from idea to deployed app in minutes, not days. Our AI generates production-ready code instantly."
            },
            {
              icon: <CodeBracketIcon className="w-8 h-8" />,
              title: "Professional Code",
              description: "Get clean, maintainable code using modern frameworks and best practices. No spaghetti code here."
            },
            {
              icon: <RocketLaunchIcon className="w-8 h-8" />,
              title: "Deploy Anywhere",
              description: "One-click deployment to the cloud or export your project to work with any hosting provider."
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center p-8 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 text-primary mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <CommunityProjects />

      {/* Projects Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="px-4"
      >
        <ProjectsList />
      </motion.section>

      {/* Pricing Section */}
      <motion.section 
        className="py-24 px-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that's right for you. Upgrade or downgrade at any time.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PRICING_PLANS.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} index={index} />
          ))}
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section 
        className="py-24 px-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Frequently asked questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about Devle
            </p>
          </div>

          <div className="space-y-4">
            {FAQ_DATA.map((faq, index) => (
              <FAQItem key={index} faq={faq} index={index} />
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-24 px-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="text-center bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 rounded-3xl p-16 max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} className="w-6 h-6 text-yellow-400 fill-current" />
            ))}
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to build your next project?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are already building amazing things with Devle.
          </p>
          
        </div>
      </motion.section>
    </div>
          </div>

  );
};

export default Page;