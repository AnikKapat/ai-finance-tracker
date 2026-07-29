import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { featuresData, howItWorksData } from "@/data/landing";
import HeroSection from "@/components/hero";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F3E7B3]">
      <HeroSection />

      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#F3E7B3]">
            Everything you need to manage your finances
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresData.map((feature, index) => (
              <Card className="border-[#2A2A2D] bg-[#161618] p-6 shadow-none" key={index}>
                <CardContent className="space-y-4 pt-4">
                  {feature.icon}
                  <h3 className="text-xl font-semibold text-[#F3E7B3]">{feature.title}</h3>
                  <p className="text-[#F3E7B3]/70">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#2A2A2D] bg-[#161618] py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-[#F3E7B3]">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {howItWorksData.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-[#D4AF37]/15 rounded-full flex items-center justify-center mx-auto mb-6 text-[#D4AF37]">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-[#F3E7B3]">{step.title}</h3>
                <p className="text-[#F3E7B3]/70">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
