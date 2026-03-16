"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Headset,
  MessageSquare,
  Phone,
  Mail,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomerSupportPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 py-24 sm:py-32 rounded-[40px] mb-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.1),transparent)]" />
        <div className="container relative mx-auto px-6 lg:px-8 text-center">
          <div className="mx-auto max-w-2xl">
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl uppercase">
              How can we <span className="text-primary">help?</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300 font-medium">
              Find answers, talk to our support team, or explore 
              our knowledge base to get the most out of ANEC Global.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <div className="relative w-full max-w-lg group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search for help articles..."
                  className="w-full bg-white/10 border border-white/20 rounded-full py-4 pl-12 pr-6 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all backdrop-blur-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <div className="container mx-auto px-4 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] p-10 bg-white text-center hover:-translate-y-2 transition-all duration-300 cursor-pointer group">
            <div className="h-20 w-20 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
              <MessageSquare className="h-10 w-10 text-primary group-hover:text-black transition-colors" />
            </div>
            <h3 className="font-black text-xl text-slate-900">Live Chat</h3>
            <p className="text-slate-500 font-medium mt-3">
              Instant help from our dedicated support champions.
            </p>
            <div className="mt-6 text-primary font-bold text-sm uppercase tracking-widest group-hover:translate-x-1 transition-transform inline-flex items-center gap-2">
              Start chat <span>&rarr;</span>
            </div>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] p-10 bg-white text-center hover:-translate-y-2 transition-all duration-300 cursor-pointer group">
            <div className="h-20 w-20 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors">
              <Phone className="h-10 w-10 text-blue-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-black text-xl text-slate-900">Call Support</h3>
            <p className="text-slate-500 font-medium mt-3">
              Mon-Fri from 9am to 6pm. We're just a call away.
            </p>
            <div className="mt-6 text-blue-500 font-bold text-sm uppercase tracking-widest group-hover:translate-x-1 transition-transform inline-flex items-center gap-2">
              View number <span>&rarr;</span>
            </div>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] p-10 bg-white text-center hover:-translate-y-2 transition-all duration-300 cursor-pointer group">
            <div className="h-20 w-20 mx-auto bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-slate-900 transition-colors">
              <Mail className="h-10 w-10 text-slate-900 group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-black text-xl text-slate-900">Email Us</h3>
            <p className="text-slate-500 font-medium mt-3">
              Drop us a line anytime. We respond within 24 hours.
            </p>
            <div className="mt-6 text-slate-900 font-bold text-sm uppercase tracking-widest group-hover:translate-x-1 transition-transform inline-flex items-center gap-2">
              Send email <span>&rarr;</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        {/* FAQs */}
        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[40px] bg-white overflow-hidden p-12">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">FAQs</h2>
            <Button variant="ghost" className="font-bold text-slate-400 hover:text-primary transition-colors">View All</Button>
          </div>
          <div className="space-y-8">
            {[
              { q: "How do I track my order?", a: "You can track your order by going to the 'Order Tracking' section in your profile dashboard." },
              { q: "What is your return policy?", a: "We offer a 30-day return policy for all items in original condition. Contact support to initiate a return." },
              { q: "How do I earn points?", a: "Every purchase you make and friends you refer automatically grant you loyalty points." }
            ].map((item, i) => (
              <div key={i} className="group cursor-pointer">
                <h4 className="font-bold text-slate-900 mb-2 flex items-center justify-between group-hover:text-primary transition-colors">
                  {item.q}
                  <span className="text-slate-300 group-hover:rotate-90 transition-transform">&rarr;</span>
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Contact Form */}
        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[40px] bg-white overflow-hidden p-12">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-4">Send a message</h2>
          <p className="text-slate-500 font-medium mb-8">Can't find what you're looking for? Reach out to us directly.</p>
          
          <form className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">FullName</label>
                <input type="text" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                <input type="email" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all font-bold" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</label>
              <select className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all font-bold appearance-none">
                <option>Delivery Issue</option>
                <option>Product Inquiries</option>
                <option>Account Support</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Message</label>
              <textarea rows={4} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
            </div>
            <Button className="w-full bg-primary text-black font-black py-8 rounded-2xl text-lg hover:scale-[1.02] transition-transform shadow-lg shadow-amber-200 uppercase tracking-widest">
              Send Message
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
