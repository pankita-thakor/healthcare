import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
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
  Users
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    title: "24/7 Doctor Access",
    desc: "Connect with licensed doctors anytime through chat and video consults.",
    icon: Stethoscope,
    color: "bg-blue-500/10 text-blue-500"
  },
  {
    title: "AI Health Companion",
    desc: "Track symptoms, get smart reminders, and understand your care journey.",
    icon: Brain,
    color: "bg-purple-500/10 text-purple-500"
  },
  {
    title: "Medication Tracking",
    desc: "Never miss a dose with timely alerts and refill notifications.",
    icon: Activity,
    color: "bg-emerald-500/10 text-emerald-500"
  },
  {
    title: "Secure Health Records",
    desc: "Your reports and prescriptions are encrypted and always available.",
    icon: ShieldCheck,
    color: "bg-amber-500/10 text-amber-500"
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
    name: "General Physician",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200",
    specialty: "Primary Care"
  },
  {
    name: "Cardiologist",
    image: "https://images.unsplash.com/photo-1559839734-2b71f1e3c770?auto=format&fit=crop&q=80&w=200&h=200",
    specialty: "Heart Specialist"
  },
  {
    name: "Dermatologist",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200",
    specialty: "Skin Care"
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
          className={`h-3.5 w-3.5 ${idx < value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] rounded-full bg-accent/10 blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link href={"/" as Route} className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <HeartPulse className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Healthyfy
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
            <a href="#features" className="transition-colors hover:text-primary">Features</a>
            <a href="#conditions" className="transition-colors hover:text-primary">Conditions</a>
            <a href="#doctors" className="transition-colors hover:text-primary">Doctors</a>
            <a href="#how-it-works" className="transition-colors hover:text-primary">How It Works</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href={"/login" as Route} className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block px-4">
              Login
            </Link>
            <Button asChild className="rounded-full px-6 shadow-md shadow-primary/10 transition-all hover:shadow-lg hover:shadow-primary/20">
              <Link href={"/signup" as Route}>Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container pt-20 pb-16 lg:pt-32 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary animate-in fade-in slide-in-from-bottom-3 duration-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Smart Healthcare Platform
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                Personalized care, <br />
                <span className="text-primary italic font-serif">right when you </span>
                need it.
              </h1>
              <p className="max-w-[540px] text-lg lg:text-xl text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
                Healthyfy combines expert doctors, proactive monitoring, and AI-powered guidance so families can manage
                everyday health and chronic conditions with confidence.
              </p>
              <div className="flex flex-wrap gap-4 pt-2 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                <Button size="lg" className="rounded-full px-8 h-12 text-base" asChild>
                  <Link href={"/signup" as Route}>Book Consultation <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base bg-background/50 backdrop-blur-sm">
                  Explore Plans
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-8 pt-6 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-400">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                      <Image 
                        src={`https://i.pravatar.cc/100/?u=${i + 10}`} 
                        alt="User" 
                        width={40} 
                        height={40} 
                      />
                    </div>
                  ))}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-primary text-[10px] font-bold text-primary-foreground">
                    +75k
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1">
                    <RatingStars value={5} />
                    <span className="text-sm font-bold ml-1">4.9/5</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Trusted by 75,000+ patients</p>
                </div>
              </div>
            </div>

            <div className="relative animate-in fade-in zoom-in-95 duration-1000 delay-200">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-tr from-primary/20 via-transparent to-accent/20 blur-2xl opacity-50" />
              <Card className="relative overflow-hidden border-border/50 bg-background/60 backdrop-blur-xl shadow-2xl rounded-[2rem] p-2">
                <div className="bg-muted/30 rounded-[1.5rem] p-6 lg:p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xl">Health Snapshot</h3>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 rounded-full px-3 py-1">
                      Today
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="group rounded-2xl border border-border/50 bg-background/80 p-4 transition-all hover:border-primary/30 hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                          <CalendarCheck2 className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">Next Appointment</p>
                          <p className="font-bold">Dr. Nisha Rao - Cardiology</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Today at 6:30 PM</p>
                        </div>
                      </div>
                    </div>

                    <div className="group rounded-2xl border border-border/50 bg-background/80 p-4 transition-all hover:border-primary/30 hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <Activity className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">Medication Reminder</p>
                          <p className="font-bold">Metformin 500mg</p>
                          <p className="text-xs text-muted-foreground mt-0.5">8:00 PM • After dinner</p>
                        </div>
                      </div>
                    </div>

                    <div className="group rounded-2xl border border-border/50 bg-primary/5 p-4 transition-all hover:border-primary/30">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-primary">Health Score</p>
                        <p className="text-xl font-black text-primary">92%</p>
                      </div>
                      <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full w-[92%] transition-all duration-1000" />
                      </div>
                      <p className="text-[10px] text-primary/70 mt-2 font-semibold uppercase tracking-wider">Excellent adherence</p>
                    </div>
                  </div>

                  <div className="pt-2 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-border/50 bg-background/40 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Steps</p>
                      <p className="text-lg font-bold mt-1">8,432</p>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-background/40 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Sleep</p>
                      <p className="text-lg font-bold mt-1">7h 20m</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Decorative elements */}
              <div className="absolute -right-8 -bottom-8 h-24 w-24 bg-accent/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 h-16 w-16 bg-primary/20 rounded-full blur-xl animate-bounce duration-[3000ms]" />
            </div>
          </div>
        </section>

        {/* Marquee Section */}
        <div className="relative border-y border-border/40 bg-muted/30 py-10 overflow-hidden">
          <div className="flex animate-[slide_30s_linear_infinite] whitespace-nowrap">
            {[...sliderItems, ...sliderItems, ...sliderItems].map((item, idx) => (
              <div key={`${item}-${idx}`} className="mx-8 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary/40" />
                <span className="text-lg font-semibold tracking-tight text-muted-foreground/80 italic">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="container py-24 lg:py-32">
          <div className="max-w-3xl mb-16 space-y-4">
            <Badge variant="outline" className="rounded-full px-4 py-1 border-primary/20 text-primary bg-primary/5">
              Features
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">
              Features that <span className="text-primary italic font-serif">simplify</span> healthcare.
            </h2>
            <p className="text-lg text-muted-foreground">
              We&apos;ve built everything you need to manage your health in one place, with a focus on simplicity and security.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => (
              <Card key={feature.title} className="group relative overflow-hidden border-border/60 bg-background/50 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                <CardHeader className="space-y-4">
                  <div className={`h-12 w-12 rounded-2xl ${feature.color} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </CardContent>
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Plus className="h-3 w-3 text-primary" />
                   </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Conditions Section */}
        <section id="conditions" className="relative py-24 bg-muted/40 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] [background-image:radial-gradient(circle_at_center,black_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="container relative">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">Medical conditions we support</h2>
              <p className="text-muted-foreground">Specialized care pathways for chronic and everyday health concerns.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {conditions.map((condition) => (
                <div 
                  key={condition} 
                  className="group flex items-center justify-between rounded-2xl border border-border/60 bg-background/80 p-5 transition-all hover:border-primary/40 hover:bg-background hover:shadow-lg hover:shadow-primary/5"
                >
                  <span className="font-bold tracking-tight">{condition}</span>
                  <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Doctors Section */}
        <section id="doctors" className="container py-24 lg:py-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-4 max-w-2xl">
              <Badge variant="outline" className="rounded-full px-4 py-1 border-primary/20 text-primary bg-primary/5">
                Specialists
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">Consult with the best.</h2>
              <p className="text-lg text-muted-foreground">Access verified specialists with transparent ratings and proven expertise.</p>
            </div>
            <Button variant="ghost" className="rounded-full group">
              View all specialists <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {doctorCategories.map((doctor, idx) => (
              <div key={doctor.name} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-3xl" />
                <div className="aspect-[4/5] relative overflow-hidden rounded-3xl border border-border/50 bg-muted">
                  <Image 
                    src={doctor.image} 
                    alt={doctor.name} 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                    <p className="text-white/80 text-sm font-medium">{doctor.specialty}</p>
                    <h3 className="text-white text-2xl font-bold mt-1">{doctor.name}</h3>
                    <div className="flex items-center gap-1 mt-3">
                      <RatingStars value={5} />
                      <span className="text-white/90 text-xs font-bold ml-1">4.9 (120+ reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between px-2">
                   <div>
                     <h4 className="font-bold text-lg">{doctor.name}</h4>
                     <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                   </div>
                   <div className="h-10 w-10 rounded-full border border-border flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground transition-all">
                      <ArrowRight className="h-5 w-5" />
                   </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="container py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="outline" className="rounded-full px-4 py-1 border-primary/20 text-primary bg-primary/5">
                  Process
                </Badge>
                <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">Your health journey, <span className="text-primary italic font-serif">simplified.</span></h2>
              </div>
              
              <div className="space-y-6">
                {[
                  { title: "Choose a specialist", icon: Stethoscope, desc: "Search by symptoms, specialty, and availability from our curated list of verified experts." },
                  { title: "Book and consult", icon: CalendarCheck2, desc: "Pick your slot and connect by secure video call or chat within minutes." },
                  { title: "Follow treatment plan", icon: Smartphone, desc: "Get AI-powered medicine reminders and proactive progress check-ins." }
                ].map((step, idx) => (
                  <div key={step.title} className="flex gap-6 group">
                    <div className="flex-shrink-0 relative">
                      <div className="h-14 w-14 rounded-2xl bg-background border border-border/60 shadow-sm flex items-center justify-center z-10 relative group-hover:border-primary/40 transition-colors">
                        <step.icon className="h-6 w-6 text-primary" />
                      </div>
                      {idx !== 2 && (
                        <div className="absolute top-14 left-7 bottom-[-24px] w-[1px] bg-border/60 group-hover:bg-primary/30 transition-colors" />
                      )}
                    </div>
                    <div className="pb-8">
                      <h3 className="text-xl font-bold mb-2">{idx + 1}. {step.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/10 rounded-[2.5rem] blur-3xl opacity-30" />
              <div className="relative rounded-[2rem] overflow-hidden border border-border/50 shadow-2xl bg-muted aspect-square">
                <Image 
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800&h=800" 
                  alt="Healthcare professional" 
                  fill 
                  className="object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent mix-blend-multiply" />
                <div className="absolute bottom-8 left-8 right-8 bg-background/90 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                         <ShieldCheck className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">HIPAA Compliant</p>
                        <p className="text-xs text-muted-foreground">Your data is encrypted & secure</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-foreground text-background py-24 lg:py-32 overflow-hidden">
          <div className="container">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16">
              <div className="space-y-4 max-w-2xl">
                 <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">Trusted by patients <br />and families across India.</h2>
                 <p className="text-background/60 text-lg">Don&apos;t just take our word for it, hear from our vibrant community.</p>
              </div>
              <div className="flex-shrink-0 bg-background/10 backdrop-blur-sm rounded-3xl p-8 border border-background/10">
                 <p className="text-sm text-background/60 font-bold uppercase tracking-widest mb-2">Average Rating</p>
                 <div className="flex items-end gap-3">
                    <span className="text-5xl font-black">4.8</span>
                    <div className="pb-1.5 space-y-1">
                      <RatingStars value={5} />
                      <p className="text-xs font-medium text-background/40">Out of 5,000+ reviews</p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, idx) => (
                <div 
                  key={testimonial.name} 
                  className={`p-8 rounded-[2rem] border border-background/10 bg-background/5 backdrop-blur-sm space-y-6 ${idx === 1 ? 'md:translate-y-8' : ''}`}
                >
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-primary/40">
                        <Image src={testimonial.avatar} alt={testimonial.name} width={48} height={48} />
                     </div>
                     <div>
                       <p className="font-bold">{testimonial.name}</p>
                       <p className="text-xs text-background/40">{testimonial.role}</p>
                     </div>
                  </div>
                  <RatingStars value={testimonial.rating} />
                  <p className="text-lg leading-relaxed text-background/80 font-medium italic">
                    &quot;{testimonial.quote}&quot;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-24 lg:py-32">
          <div className="relative rounded-[3rem] bg-primary overflow-hidden p-12 lg:p-24 text-center">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:32px_32px]" />
             <div className="absolute -top-24 -right-24 h-64 w-64 bg-white/20 rounded-full blur-3xl animate-pulse" />
             <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-accent/30 rounded-full blur-3xl animate-bounce duration-[5000ms]" />
             
             <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                <h2 className="text-4xl lg:text-6xl font-bold tracking-tight text-primary-foreground">
                  Ready to transform your health?
                </h2>
                <p className="text-xl text-primary-foreground/80 font-medium">
                  Join 75,000+ users who trust Healthyfy for their daily healthcare needs.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                   <Button size="lg" className="rounded-full px-10 h-14 text-lg font-bold shadow-xl" asChild>
                      <Link href={"/signup" as Route}>Get Started Now</Link>
                   </Button>
                   <Button size="lg" variant="outline" className="rounded-full px-10 h-14 text-lg font-bold border-white/20 text-primary-foreground hover:bg-white/10">
                      Speak with an Advisor
                   </Button>
                </div>
             </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 bg-muted/30 pt-20 pb-10">
        <div className="container grid gap-12 lg:grid-cols-4 mb-16">
          <div className="lg:col-span-2 space-y-6">
            <Link href={"/" as Route} className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <HeartPulse className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">Healthyfy</span>
            </Link>
            <p className="max-w-md text-muted-foreground leading-relaxed">
              Healthyfy is reimagining healthcare for the digital age. We provide families with the tools and expertise needed to live healthier, longer lives.
            </p>
            <div className="flex gap-4">
               {[1, 2, 3, 4].map((i) => (
                 <div key={i} className="h-10 w-10 rounded-full bg-background border border-border/60 flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer">
                    <Smartphone className="h-4 w-4" />
                 </div>
               ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#doctors" className="hover:text-primary transition-colors">Our Doctors</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Press</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="container pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
          <p>© {new Date().getFullYear()} Healthyfy Inc. All rights reserved.</p>
          <div className="flex gap-8">
             <span>Made with ❤️ for a healthier world</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
