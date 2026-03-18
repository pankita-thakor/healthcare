"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  Brain,
  CalendarCheck2,
  CheckCircle2,
  HeartPulse,
  Plus,
  ShieldCheck,
  Smartphone,
  Star,
  Stethoscope,
  UserRound,
  Users,
  MessageCircle,
  Zap,
  ChevronRight,
  Shield,
  MousePointer2,
  Search
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type MotionShimProps = {
  children?: ReactNode;
  [key: string]: unknown;
};

function stripMotionProps(props: MotionShimProps) {
  const {
    initial,
    animate,
    exit,
    transition,
    whileHover,
    whileInView,
    whileTap,
    variants,
    layout,
    layoutId,
    viewport,
    ...rest
  } = props;

  void initial;
  void animate;
  void exit;
  void transition;
  void whileHover;
  void whileInView;
  void whileTap;
  void variants;
  void layout;
  void layoutId;
  void viewport;

  return rest;
}

const motion = {
  div: ({ children, ...props }: MotionShimProps) => <div {...(stripMotionProps(props) as Record<string, unknown>)}>{children}</div>,
  span: ({ children, ...props }: MotionShimProps) => (
    <span {...(stripMotionProps(props) as Record<string, unknown>)}>{children}</span>
  ),
  li: ({ children, ...props }: MotionShimProps) => <li {...(stripMotionProps(props) as Record<string, unknown>)}>{children}</li>
};

function AnimatePresence({ children }: { children?: ReactNode; mode?: string }) {
  return <>{children}</>;
}

function useScroll(_options?: unknown) {
  return { scrollYProgress: 1 };
}

function useSpring<T>(value: T, _config?: unknown) {
  return value;
}

const features = [
  {
    title: "24/7 Doctor Access",
    desc: "Connect with licensed doctors anytime through chat and video consults.",
    icon: Stethoscope,
    color: "bg-blue-500/10 text-blue-500",
    detail: "Over 50+ specialties available."
  },
  {
    title: "AI Health Companion",
    desc: "Track symptoms, get smart reminders, and understand your care journey.",
    icon: Brain,
    color: "bg-purple-500/10 text-purple-500",
    detail: "Powered by advanced medical LLMs."
  },
  {
    title: "Medication Tracking",
    desc: "Never miss a dose with timely alerts and refill notifications.",
    icon: Activity,
    color: "bg-emerald-500/10 text-emerald-500",
    detail: "Syncs with local pharmacies."
  },
  {
    title: "Secure Health Records",
    desc: "Your reports and prescriptions are encrypted and always available.",
    icon: ShieldCheck,
    color: "bg-amber-500/10 text-amber-500",
    detail: "HIPAA & GDPR compliant storage."
  }
];

const conditions = [
  "Diabetes",
  "Hypertension",
  "Thyroid",
  "PCOS",
  "Asthma",
  "Heart Care",
  "Mental Wellness",
  "Digestive Health"
];

const doctorCategories = [
  {
    name: "Dr. Arvind K.",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300",
    specialty: "General Physician",
    tag: "Primary Care"
  },
  {
    name: "Dr. Sarah M.",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=600&h=800",
    specialty: "Cardiologist",
    tag: "Heart Expert"
  },
  {
    name: "Dr. Elena R.",
    image: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=600&h=800",
    specialty: "Dermatologist",
    tag: "Skin Specialist"
  }
];

const sliderItems = [
  "Instant Consultations",
  "Lab Report Uploads",
  "Family Health Profiles",
  "Prescription Management",
  "Doctor Follow-Ups",
  "Wellness Coaching"
];

const processSteps = [
  { title: "Select Specialist", desc: "Choose from 500+ verified doctors across India.", icon: Search },
  { title: "Digital Consult", desc: "Secure HD video calls and 24/7 instant chat support.", icon: Smartphone },
  { title: "Care Continuity", desc: "Proactive follow-ups and AI-powered health monitoring.", icon: HeartPulse }
];

const processImages = [
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800"
];

const processStepDetails = [
  "Advanced search algorithms to match you with the right specialist based on symptoms and language preferences.",
  "End-to-end encrypted video platform that works even on low-bandwidth connections for seamless care.",
  "Integrated health dashboard that combines your vitals, prescriptions, and AI insights in one secure location."
];

const testimonials = [
  {
    quote: "Healthyfy helped me manage my sugar levels with daily follow-ups and instant chat with specialists.",
    name: "Riya Sharma",
    role: "Diabetes Patient",
    rating: 5,
    avatar: "https://i.pravatar.cc/150/?u=riya"
  },
  {
    quote: "I booked a pediatric consultation in under 2 minutes. The experience was smooth and very reassuring.",
    name: "Ankit Verma",
    role: "Parent",
    rating: 5,
    avatar: "https://i.pravatar.cc/150/?u=ankit"
  },
  {
    quote: "The app reminders and doctor continuity kept my blood pressure stable for the first time in years.",
    name: "Meera Gupta",
    role: "Hypertension Care User",
    rating: 4,
    avatar: "https://i.pravatar.cc/150/?u=meera"
  }
];

function RatingStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} star rating`}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <Star
          key={`star-${idx}`}
          className={`h-3.5 w-3.5 ${idx < value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/10"}`}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [brokenDoctorImages, setBrokenDoctorImages] = useState<Record<string, boolean>>({});
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const stepInterval = window.setInterval(() => {
      setActiveStep((currentStep) => (currentStep + 1) % processSteps.length);
    }, 3500);

    return () => window.clearInterval(stepInterval);
  }, []);

  const aiChatMessages = [
    { type: "ai", text: "Hi! How can I help you today?" },
    { type: "user", text: "I have a headache since morning." },
    { type: "ai", text: "Is it a sharp pain or dull ache? Any other symptoms?" }
  ];

  return (
    <div ref={containerRef} className="main-landing-page relative min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Dynamic Cursor Highlight */}
      <div className="fixed inset-0 pointer-events-none z-[100] hidden lg:block opacity-20">
         <motion.div 
           className="w-96 h-96 rounded-full bg-primary/30 blur-[120px]"
           animate={{
             x: [0, 100, -100, 0],
             y: [0, -100, 100, 0],
           }}
           transition={{ duration: 10, repeat: Infinity }}
         />
      </div>

      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-[100] origin-left"
        style={{ scaleX: smoothProgress }}
      />

      {/* Background Grid & Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] [background-size:64px_64px] opacity-[0.15]" />
        <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] rounded-full bg-accent/10 blur-[150px] animate-pulse delay-1000" />
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 transition-all">
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#11927d] text-white shadow-lg shadow-[#3b82f6]/20"
            >
              <HeartPulse className="h-6 w-6" />
            </motion.div>
            <span className="font-display text-xl font-bold tracking-tight">
              <span className="text-foreground">Healthy</span><span className="text-[#11927d]">fy</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm font-medium lg:flex">
            {["Features", "Conditions", "Doctors", "How it Works"].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} 
                className="px-4 py-2 rounded-full transition-all hover:bg-muted/50 hover:text-primary"
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden h-6 w-[1px] bg-border/60 mx-1 sm:block" />
            <Link href="/login" className="hidden text-sm font-semibold hover:text-primary sm:block px-4">
              Login
            </Link>
            <Button asChild className="rounded-full px-6 font-bold shadow-lg transition-all">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Creative Hero Section */}
        <section className="container relative overflow-visible pt-16 pb-24 lg:pt-32 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8 relative z-10"
            >
              <div className="animate-soft-float inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                <Zap className="h-3 w-3 fill-primary" />
                The Future of Family Health
              </div>
              <h1 className="text-6xl lg:text-[5.5rem] font-black leading-[0.9] tracking-tighter">
                Health <br />
                <span className="animate-text-shimmer text-primary italic font-serif relative">
                  Simplified.
                  <motion.span 
                    className="absolute -bottom-2 left-0 w-full h-2 bg-primary/20 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 1, duration: 0.8 }}
                  />
                </span>
              </h1>
              <p className="max-w-[500px] text-lg lg:text-xl text-muted-foreground leading-relaxed font-medium">
                Expert doctors, AI-driven monitoring, and a seamless care journey—all in your pocket. Because your family deserves the best.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button size="lg" className="sheen-button animate-glow-pulse rounded-full px-8 h-14 text-lg font-bold group bg-primary hover:bg-primary/90" asChild>
                  <Link href="/signup">
                    Consult Now <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="sheen-button rounded-full px-8 h-14 text-lg font-bold backdrop-blur-sm bg-background/40">
                  Our Specialists
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center gap-8 pt-8 border-t border-border/40">
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ y: -5, zIndex: 10 }}
                      className="h-12 w-12 rounded-full border-2 border-background bg-muted overflow-hidden cursor-pointer"
                    >
                      <Image 
                        src={`https://i.pravatar.cc/100/?u=${i + 15}`} 
                        alt="Avatar" 
                        width={48} 
                        height={48} 
                      />
                    </motion.div>
                  ))}
                </div>
                <div>
                   <div className="flex items-center gap-1.5">
                      <RatingStars value={5} />
                      <span className="text-sm font-black">4.9/5</span>
                   </div>
                   <p className="text-xs text-muted-foreground font-semibold">from 75k+ satisfied patients</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative px-4 py-8 lg:px-10 perspective-1000"
            >
              <div className="absolute -inset-10 bg-gradient-to-tr from-primary/30 to-accent/30 rounded-full blur-[100px] opacity-40 animate-pulse" />
              
              {/* Interactive Phone Mockup */}
              <motion.div 
                whileHover={{ rotateY: 5, rotateX: -5 }}
              className="animate-soft-float-delayed relative z-10 w-full max-w-[420px] mx-auto overflow-hidden rounded-[3rem] border-8 border-foreground/5 bg-background shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] shadow-primary/10"
              >
                <div className="absolute top-0 inset-x-0 h-8 flex items-center justify-center gap-1.5 bg-muted/20">
                   <div className="w-12 h-4 rounded-full bg-foreground/10" />
                </div>
                <div className="p-6 pt-12 space-y-6 min-h-[580px] bg-gradient-to-b from-muted/30 to-background">
                  <div className="flex items-center justify-between">
                     <div>
                       <p className="text-xs text-muted-foreground font-bold">Good morning,</p>
                       <h3 className="font-bold text-xl">Arjun Sharma</h3>
                     </div>
                     <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Users className="h-5 w-5" />
                     </div>
                  </div>

                  <Card className="border-border/60 bg-background/80 backdrop-blur-sm rounded-[2rem] overflow-hidden group transition-all hover:shadow-lg">
                     <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                           <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none font-bold">Appointment</Badge>
                           <span className="text-xs text-muted-foreground font-bold uppercase">In 45 mins</span>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="h-14 w-14 rounded-2xl overflow-hidden bg-muted">
                              <Image src="https://i.pravatar.cc/100/?u=doc1" alt="Doctor" width={56} height={56} />
                           </div>
                           <div>
                              <p className="font-bold">Dr. Nisha Rao</p>
                              <p className="text-xs text-muted-foreground">General Physician • Video Call</p>
                           </div>
                        </div>
                        <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold h-10">Join Consultation</Button>
                     </CardContent>
                  </Card>

                  <div className="space-y-3">
                     <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold">Daily Progress</h4>
                        <span className="text-xs text-primary font-black uppercase">Goal 85%</span>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                           <Activity className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                           <p className="text-xs text-emerald-600 font-bold uppercase">Health Score</p>
                           <p className="text-xl font-black text-emerald-700">92</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                           <Brain className="h-5 w-5 text-amber-500 mx-auto mb-2" />
                           <p className="text-xs text-amber-600 font-bold uppercase">Mindfulness</p>
                           <p className="text-xl font-black text-amber-700">15m</p>
                        </div>
                     </div>
                  </div>

                  {/* Mock AI Chat Bubble */}
                  <motion.div 
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="p-4 rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 relative"
                  >
                    <div className="absolute -top-2 left-4 h-4 w-4 bg-primary rotate-45" />
                    <div className="flex gap-3">
                       <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                          <Brain className="h-4 w-4" />
                       </div>
                       <p className="text-xs font-medium leading-relaxed italic">
                         &quot;Your blood pressure trend is improving! Don&apos;t forget your evening medication.&quot;
                       </p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Decorative Floating Elements */}
              <motion.div 
                animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute right-0 top-1/4 z-20 hidden 2xl:block"
              >
                <div className="animate-glass-drift p-4 rounded-xl bg-background shadow-2xl border border-border/40 backdrop-blur-md flex items-center gap-3">

                   <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      <CalendarCheck2 className="h-5 w-5" />
                   </div>
                   <div>
                      <p className="text-xs font-black uppercase text-muted-foreground">Booking</p>
                      <p className="text-xs font-bold">Consultation Confirmed</p>
                   </div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, -20, 0], x: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute left-0 bottom-1/4 z-20 hidden 2xl:block"
              >
                <div className="animate-glass-drift-delayed p-4 rounded-2xl bg-background shadow-2xl border border-border/40 backdrop-blur-md flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <Activity className="h-5 w-5" />
                   </div>
                   <div>
                      <p className="text-xs font-black uppercase text-muted-foreground">Realtime</p>
                      <p className="text-xs font-bold">Vitals Syncing...</p>
                   </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Marquee Ticker */}
        <div className="relative border-y border-border/60 bg-muted/30 py-12 overflow-hidden">
          <div className="flex animate-[slide_40s_linear_infinite] whitespace-nowrap">
            {[...sliderItems, ...sliderItems, ...sliderItems].map((item, idx) => (
              <div key={`${item}-${idx}`} className="mx-12 flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-2xl font-black tracking-tight text-foreground/40 italic hover:text-primary transition-colors cursor-default select-none uppercase">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Features with Hover Effects */}
        <section id="features" className="container py-24 lg:py-40">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
            <div className="space-y-6 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-black uppercase tracking-widest text-primary">
                Features
              </div>
              <h2 className="text-5xl lg:text-7xl font-black tracking-tighter">
                Health tech <br />that <span className="text-primary italic font-serif">works for you.</span>
              </h2>
            </div>
            <p className="text-xl text-muted-foreground font-medium max-w-[350px]">
              We simplified the complex stuff so you can focus on living your best life.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="surface-sheen group relative overflow-hidden p-8 rounded-[2.5rem] border border-border/60 bg-background/50 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5"
              >
                <div className={`h-16 w-16 rounded-[1.5rem] ${feature.color} flex items-center justify-center mb-8 transition-transform group-hover:rotate-6 duration-300`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-medium mb-6">{feature.desc}</p>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary/60 group-hover:text-primary transition-colors">
                   {feature.detail} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
                <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* AI Companion Preview - High Interactivity */}
        <section id="ai-companion" className="relative py-24 lg:py-40 bg-foreground text-background overflow-hidden">
           <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:40px_40px]" />
           </div>
           
           <div className="container relative">
              <div className="grid lg:grid-cols-2 gap-20 items-center">
                 <div className="space-y-10">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-black uppercase tracking-widest text-white">
                      AI Integration
                    </div>
                    <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[0.9]">
                      Your <span className="text-primary">24/7 AI</span> <br />Health Coach.
                    </h2>
                    <p className="text-xl text-background/60 leading-relaxed font-medium">
                      Healthyfy AI understands your vitals, analyzes your symptoms, and proactively suggests lifestyle adjustments before issues arise.
                    </p>
                    
                    <ul className="space-y-6">
                       {[
                         "Smart symptom analysis in 30 seconds",
                         "Proactive medication & hydration alerts",
                         "Personalized daily health action plans"
                       ].map((item, i) => (
                         <motion.li 
                           key={i}
                           initial={{ opacity: 0, x: -20 }}
                           whileInView={{ opacity: 1, x: 0 }}
                           transition={{ delay: i * 0.2 }}
                           className="flex items-center gap-4 text-lg font-bold"
                         >
                           <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="h-5 w-5 text-foreground" />
                           </div>
                           {item}
                         </motion.li>
                       ))}
                    </ul>

                    <Button
                      variant="outline"
                      size="lg"
                      className="sheen-button rounded-full px-10 h-14 border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background font-bold text-lg"
                    >
                       Meet the AI
                    </Button>
                 </div>

                 <div className="relative">
                    <motion.div 
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      className="bg-background rounded-[2.5rem] p-8 shadow-2xl relative z-10"
                    >
                       <div className="flex items-center gap-4 mb-10 pb-6 border-b border-border/40">
                          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                             <Brain className="h-8 w-8" />
                          </div>
                          <div>
                             <h4 className="font-bold text-xl text-foreground">Healthyfy AI</h4>
                             <p className="text-xs text-emerald-500 font-black uppercase tracking-widest">Always Online • Proactive</p>
                          </div>
                       </div>

                       <div className="space-y-6 mb-10">
                          {aiChatMessages.map((msg, i) => (
                            <motion.div 
                              key={i}
                              initial={{ opacity: 0, scale: 0.9, x: msg.type === "ai" ? -20 : 20 }}
                              whileInView={{ opacity: 1, scale: 1, x: 0 }}
                              transition={{ delay: i * 0.3 }}
                              className={`flex ${msg.type === "ai" ? "justify-start" : "justify-end"}`}
                            >
                               <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium shadow-sm ${msg.type === "ai" ? "bg-muted text-foreground rounded-bl-none" : "bg-primary text-primary-foreground rounded-br-none"}`}>
                                  {msg.text}
                               </div>
                            </motion.div>
                          ))}
                       </div>

                       <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Type a message..." 
                            className="w-full h-14 bg-muted/50 border-none rounded-2xl px-6 pr-14 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary transition-all outline-none"
                            readOnly
                          />
                          <div className="absolute right-3 top-2 h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                             <ArrowRight className="h-5 w-5" />
                          </div>
                       </div>
                    </motion.div>
                    
                    {/* Decorative Background for AI section */}
                    <div className="absolute -inset-10 bg-primary/20 rounded-[5rem] blur-[100px] -z-10 animate-pulse" />
                 </div>
              </div>
           </div>
        </section>

        {/* Specialists with Interactive Hover */}
        <section id="doctors" className="container py-24 lg:py-40">
           <div className="text-center space-y-6 max-w-3xl mx-auto mb-24">
              <Badge variant="outline" className="rounded-full px-6 py-1.5 border-primary/20 text-primary bg-primary/5 font-black uppercase tracking-widest">
                Our Specialists
              </Badge>
              <h2 className="text-5xl lg:text-7xl font-black tracking-tighter">
                Consult with <span className="text-primary italic font-serif">elite</span> minds.
              </h2>
              <p className="text-xl text-muted-foreground font-medium">
                We only onboard the top 5% of medical professionals to ensure you receive world-class care.
              </p>
           </div>

           <div className="grid md:grid-cols-3 gap-10">
              {doctorCategories.map((doctor, idx) => (
                <motion.div 
                  key={doctor.name}
                  whileHover={{ y: -15 }}
                  className="group relative"
                >
                  <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden border border-border/40 shadow-2xl">
                     {brokenDoctorImages[doctor.name] ? (
                       <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/15 via-background to-muted p-8 text-center">
                         <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-primary">
                           <UserRound className="h-10 w-10" />
                         </div>
                         <p className="text-2xl font-black text-foreground">{doctor.name}</p>
                         <p className="mt-2 text-sm font-bold italic text-muted-foreground">{doctor.specialty}</p>
                       </div>
                     ) : (
                       <Image
                         src={doctor.image}
                         alt={doctor.name}
                         fill
                         className="object-cover transition-transform duration-700"
                         onError={() =>
                           setBrokenDoctorImages((currentState) => ({
                             ...currentState,
                             [doctor.name]: true
                           }))
                         }
                       />
                     )}
                     <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                     
                     <div className="absolute bottom-0 left-0 right-0 p-8 translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10">
                        <Badge className="mb-4 bg-primary/20 text-primary border-none font-black uppercase text-xs tracking-widest">{doctor.tag}</Badge>
                        <h3 className="text-3xl font-black text-background mb-2">{doctor.name}</h3>
                        <p className="text-background/60 font-bold mb-6 italic">{doctor.specialty}</p>
                        <Button className="w-full rounded-2xl bg-primary text-primary-foreground font-black h-14 shadow-xl">Book Session</Button>
                     </div>
                  </div>
                  
                  <div className="mt-8 flex items-center justify-between px-4 group-hover:opacity-0 transition-opacity">
                     <div>
                        <h4 className="text-2xl font-black">{doctor.name}</h4>
                        <p className="text-sm text-muted-foreground font-bold italic">{doctor.specialty}</p>
                     </div>
                     <div className="h-12 w-12 rounded-full border border-border/60 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground transition-all">
                        <ChevronRight className="h-6 w-6" />
                     </div>
                  </div>
                </motion.div>
              ))}
           </div>
        </section>

        {/* Interactive Steps Section */}
        <section id="how-it-works" className="relative py-24 lg:py-40 bg-muted/30 overflow-hidden">
           <div className="container">
              <div className="grid lg:grid-cols-2 gap-20 items-center">
                 <div className="space-y-12">
                    <div className="space-y-6">
                       <Badge variant="outline" className="rounded-full px-4 py-1 border-primary/20 text-primary bg-primary/5 font-black uppercase tracking-widest">Process</Badge>
                       <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[0.9]">How <br /><span className="italic font-serif"><span className="text-foreground">Healthy</span><span className="text-[#11927d]">fy</span></span> works.</h2>
                    </div>

                    <div className="space-y-2">
                       {processSteps.map((step, i) => (
                         <div 
                           key={step.title}
                           onClick={() => setActiveStep(i)}
                           className={`p-8 rounded-[2rem] cursor-pointer transition-all border ${activeStep === i ? 'bg-background border-primary shadow-xl' : 'border-transparent hover:bg-background/50 opacity-60'}`}
                         >
                            <div className="flex gap-6 items-start">
                               <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${activeStep === i ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-muted text-muted-foreground'}`}>
                                  <step.icon className="h-6 w-6" />
                               </div>
                               <div>
                                  <h3 className={`text-xl font-black mb-2 ${activeStep === i ? 'text-foreground' : 'text-muted-foreground'}`}>0{i+1}. {step.title}</h3>
                                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{step.desc}</p>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="relative lg:h-[700px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                       <motion.div 
                         key={activeStep}
                         initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                         animate={{ opacity: 1, scale: 1, rotate: 0 }}
                         exit={{ opacity: 0, scale: 0.8, rotate: 5 }}
                         transition={{ duration: 0.5, type: "spring" }}
                         className="relative z-10 w-full max-w-[500px] aspect-[4/5] rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-8 border-background bg-muted"
                       >
                          <Image 
                            src={processImages[activeStep]} 
                            alt="Process" 
                            fill 
                            className="object-cover" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-10 left-10 right-10">
                             <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                                <p className="text-white font-black uppercase text-xs tracking-widest mb-2">Step Details</p>
                                <p className="text-white/80 text-sm font-medium italic">
                                   {processStepDetails[activeStep]}
                                </p>
                             </div>
                          </div>
                       </motion.div>
                    </AnimatePresence>
                    <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                      {processSteps.map((step, index) => (
                        <button
                          key={step.title}
                          type="button"
                          aria-label={`Show ${step.title}`}
                          onClick={() => setActiveStep(index)}
                          className={`h-2.5 rounded-full transition-all ${activeStep === index ? "w-10 bg-primary" : "w-2.5 bg-foreground/20 hover:bg-foreground/35"}`}
                        />
                      ))}
                    </div>
                    
                    {/* Floating Orbs for the step section */}
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                      transition={{ duration: 15, repeat: Infinity }}
                      className="absolute -top-20 -right-20 h-80 w-80 bg-primary/10 rounded-full blur-[100px] -z-10"
                    />
                 </div>
              </div>
           </div>
        </section>

        {/* CTA with Creative Perspective */}
        <section className="container py-24 lg:py-40">
           <motion.div 
             className="relative rounded-[4rem] bg-foreground text-background overflow-hidden p-12 lg:p-32 text-center"
           >
              <div className="absolute inset-0 pointer-events-none opacity-20 [background-image:linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] [background-size:40px_40px]" />
              
              <div className="relative z-10 space-y-12 max-w-3xl mx-auto">
                 <Badge className="bg-primary text-foreground border-none font-black uppercase tracking-[0.2em] px-6 py-2">Join the revolution</Badge>
                 <h2 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.8]">
                    Ready to live <br /><span className="text-primary italic font-serif">differently?</span>
                 </h2>
                 <p className="text-xl lg:text-2xl text-background/60 font-medium leading-relaxed">
                   Join 75,000+ modern families who have taken control of their health. The first step is just a click away.
                 </p>
                 <div className="flex flex-wrap justify-center gap-6 pt-6">
                    <Button size="lg" className="rounded-full px-12 h-16 text-xl font-black text-white transition-all shadow-2xl" asChild>
                       <Link href="/signup">Get Started Now</Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="sheen-button rounded-full px-12 h-16 text-xl font-black border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background backdrop-blur-sm"
                    >
                       Our Story
                    </Button>
                 </div>
              </div>

              {/* Decorative Floating Shapes in CTA */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-20 -left-20 h-64 w-64 border-2 border-primary/20 rounded-[3rem]"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-20 -right-20 h-64 w-64 border-2 border-primary/20 rounded-full"
              />
           </motion.div>
        </section>
      </main>

      <footer className="border-t border-border/40 bg-background/50 backdrop-blur-md pt-32 pb-16 relative overflow-hidden">
        <div className="container relative z-10">
          <div className="grid gap-20 lg:grid-cols-4 mb-24">
            <div className="lg:col-span-2 space-y-10">
              <Link href="/" className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#11927d] text-white flex items-center justify-center shadow-lg shadow-[#3b82f6]/20">
                  <HeartPulse className="h-7 w-7" />
                </div>
                <span className="font-display text-2xl font-black tracking-tight">
                <span className="text-foreground">Healthy</span><span className="text-[#11927d]">fy</span>
              </span>
              </Link>
              <p className="max-w-md text-xl text-muted-foreground font-medium leading-relaxed">
                We&apos;re building the infrastructure for a healthier world. One consultation, one AI insight, and one family at a time.
              </p>
              <div className="flex gap-4">
                 {[MessageCircle, Shield, Smartphone, Activity].map((Icon, i) => (
                   <motion.div 
                    key={i}
                    whileHover={{ y: -5 }}
                    className="h-12 w-12 rounded-2xl bg-muted/50 border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-sm"
                   >
                      <Icon className="h-5 w-5" />
                   </motion.div>
                 ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:col-span-2 gap-10">
               <div className="space-y-8">
                  <h4 className="text-sm font-black uppercase tracking-widest text-primary">Explore</h4>
                  <ul className="space-y-5 text-lg font-bold">
                    <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Our Platform</Link></li>
                    <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Specialists</Link></li>
                    <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Enterprise</Link></li>
                    <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
                  </ul>
               </div>
               <div className="space-y-8">
                  <h4 className="text-sm font-black uppercase tracking-widest text-primary">Company</h4>
                  <ul className="space-y-5 text-lg font-bold">
                    <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
                    <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Careers</Link></li>
                    <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
                    <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
                  </ul>
               </div>
            </div>
          </div>
          
          <div className="pt-10 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-8 text-sm font-bold text-muted-foreground uppercase tracking-widest">
            <p>© {new Date().getFullYear()} Healthyfy Technologies Inc.</p>
            <div className="flex gap-10">
               <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
               <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
               <Link href="#" className="hover:text-primary transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
        
        {/* Background Accent for footer */}
        <div className="absolute -bottom-40 -right-40 h-80 w-80 bg-primary/10 rounded-full blur-[120px]" />
      </footer>
      <style jsx global>{`
        @keyframes softFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -10px, 0);
          }
        }

        @keyframes softFloatDelayed {
          0%, 100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, 12px, 0);
          }
        }

        @keyframes glowPulse {
          0%, 100% {
            box-shadow: 0 12px 30px -14px rgba(16, 185, 129, 0.45);
          }
          50% {
            box-shadow: 0 18px 42px -12px rgba(16, 185, 129, 0.7);
          }
        }

        @keyframes sheenSweep {
          0% {
            transform: translateX(-160%) skewX(-20deg);
          }
          55%, 100% {
            transform: translateX(220%) skewX(-20deg);
          }
        }

        @keyframes textShimmer {
          0%, 100% {
            text-shadow: 0 0 0 rgba(16, 185, 129, 0);
            filter: saturate(1);
          }
          50% {
            text-shadow: 0 0 18px rgba(16, 185, 129, 0.22);
            filter: saturate(1.15);
          }
        }

        .animate-soft-float {
          animation: softFloat 5.8s ease-in-out infinite;
        }

        .animate-soft-float-delayed {
          animation: softFloatDelayed 6.8s ease-in-out infinite;
        }

        .animate-glass-drift {
          animation: softFloat 6.2s ease-in-out infinite;
        }

        .animate-glass-drift-delayed {
          animation: softFloatDelayed 7.4s ease-in-out infinite;
        }

        .animate-glow-pulse {
          animation: glowPulse 3.6s ease-in-out infinite;
        }

        .animate-text-shimmer {
          animation: textShimmer 4.8s ease-in-out infinite;
        }

        .sheen-button {
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }

        .sheen-button::after {
          content: "";
          position: absolute;
          inset: -20%;
          background: linear-gradient(110deg, transparent 35%, rgba(255, 255, 255, 0.35) 50%, transparent 65%);
          transform: translateX(-160%) skewX(-20deg);
          animation: sheenSweep 4.8s ease-in-out infinite;
          pointer-events: none;
        }

        .surface-sheen::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent 40%, transparent 60%, rgba(16, 185, 129, 0.08));
          opacity: 0;
          transition: opacity 300ms ease;
          pointer-events: none;
        }

        .surface-sheen:hover::before {
          opacity: 1;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-soft-float,
          .animate-soft-float-delayed,
          .animate-glass-drift,
          .animate-glass-drift-delayed,
          .animate-glow-pulse,
          .animate-text-shimmer,
          .sheen-button::after {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
