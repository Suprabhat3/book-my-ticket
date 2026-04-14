import React from "react";
import Image from "next/image";
import { Button } from "./ui/Button";

export const ExperiencePromo = () => {
  return (
    <section className="bg-surface-container rounded-xl p-12 mb-24 grid lg:grid-cols-2 gap-16 items-center clay-card">
      <div className="order-2 lg:order-1">
        <h2 className="text-5xl font-headline font-black mb-6 text-on-surface">
          The <span className="text-primary">Tactile</span> Cinema Experience
        </h2>
        <p className="text-on-surface-variant text-lg mb-8 leading-relaxed">
          Our theaters are designed with sensory comfort in mind. From the soft-molded acoustics to our signature clay-foam recliners, every detail is crafted to immerse you in the magic of film.
        </p>
        
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              surround_sound
            </span>
            <div>
              <p className="font-bold">Spatial Audio</p>
              <p className="text-xs text-on-surface-variant">360-degree immersion</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              chair
            </span>
            <div>
              <p className="font-bold">Clay Seating</p>
              <p className="text-xs text-on-surface-variant">Ergonomic comfort</p>
            </div>
          </div>
        </div>
        
        <Button variant="secondary" className="px-10">
          Explore our Venues
        </Button>
      </div>

      <div className="order-1 lg:order-2 grid grid-cols-2 gap-4">
        <div className="clay-card rounded-lg overflow-hidden h-64 mt-8 relative">
          <Image
            alt="Cinema Seating"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuALSEuqnvA99PGpssyfgxdBROwyT26TYiaPETwvbta2h7eeBD8mn_Yf9w0i1Cs6xX7_PdoxdB80OVCnWfIptAHuTDia4TxTf4BJa3MbnjZMfzVc0_hu0fMDjancY_RKuIEF2TuEvcNnKww-_Vh2c6ackMgX0qMHRpN6GhzlLenudQ_ncyXCT_u51seP764v_dUYZXb54A2lJOK5Rk5m6WkDG8tt1QcTbzcCjNgibYt_BEZt67vbwsELwSS4oHDB58WbDI3s0xYc4eo"
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover"
          />
        </div>
        <div className="clay-card rounded-lg overflow-hidden h-64 relative">
          <Image
            alt="Cinema Popcorn"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvABJPw083CwtySY3fq_u-FJEFe__W_Naoeqf4SZd6TLKeFjacnAgUpzx-DehbmQHLecRAjJpFikm7aPLRTHPIx18XSt0ZWEeYjZqUukgaD2mxyHzy6K1wSJqXs83aSqlOk7a4gkWY_r5YBvQCcFQgkryOt6alQbryTSD9rPmfFAgiwGlZembWe4I8TzlVksRqG7JsbyCfrLhpvWAAjotvdLriDVkt9jSbCnYeuPHIgfGspNH8eKl-M_oLC6QZyiZaEntf9X0iaBU"
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
};
