import React from "react";

export default function PageLayout({
  image,
  title,
  highlight,
  subtitle,
  children,
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-6">
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">

        {/* ================= LEFT PANEL ================= */}

        <div className="lg:w-2/5 bg-gradient-to-br from-green-50 via-white to-lime-50 p-10 flex flex-col justify-between">

          <div>
            <h1 className="text-4xl font-extrabold text-green-700">
              Vitals & Vitality
            </h1>

            <img
              src={image}
              alt=""
              className="
                w-80
                md:w-96
                mt-16
                mx-auto
                rounded-3xl
                rotate-6
                transition-all
                duration-500
                hover:rotate-0
                hover:-translate-y-3
                hover:scale-105
                hover:shadow-[0_40px_80px_rgba(0,0,0,0.35)]
              "
            />
          </div>

          <div className="mt-10">

            <h2 className="text-4xl font-bold leading-tight">
              {title}
              <br />

              <span className="text-green-600">
                {highlight}
              </span>

              {subtitle}
            </h2>

            <p className="mt-5 text-lg text-gray-500">
              Personalized nutrition and wellness
              <br />
              tracking designed for your unique biology.
            </p>

          </div>

        </div>

        {/* ================= RIGHT PANEL ================= */}

        <div className="flex-1 p-6 md:p-10 lg:p-16">

          {children}

        </div>

      </div>
    </div>
  );
}