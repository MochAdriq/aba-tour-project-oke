import React from "react";
import Hero from "../components/Hero/Hero";
import PromoSection from "../components/PromoSection/PromoSection";
import Packages from "../components/Packages/Packages";
import HomeNewsSection from "../components/HomeNewsSection/HomeNewsSection";
import FAQ from "../components/FAQ/FAQ";
import "./Home.css";

const Home = () => {
  return (
    <>
      <div className="home-entrance home-entrance-left home-delay-1">
        <Hero />
      </div>
      <div className="home-entrance home-entrance-right home-delay-2">
        <PromoSection />
      </div>
      <div className="home-entrance home-entrance-left home-delay-3">
        <Packages />
      </div>
      <div className="home-entrance home-entrance-right home-delay-4">
        <HomeNewsSection />
      </div>
      <div className="home-entrance home-entrance-left home-delay-5">
        <FAQ />
      </div>
    </>
  );
};

export default Home;
