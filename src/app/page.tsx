import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ─── Header ─── */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-4 sm:py-5">
        <img src="/wasl-logo.png" alt="wasl" className="h-7 sm:h-8 w-auto" />
        <span className="text-[#8a7f6e] text-[11px] sm:text-xs tracking-[0.3em] uppercase font-medium">
          Invitation
        </span>
      </header>

      {/* ─── Hero Banner ─── */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #3d1440 0%, #6b2046 30%, #8f3a3a 55%, #c4952a 100%)",
          minHeight: "clamp(200px, 35vw, 340px)",
        }}
      >
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        <div className="relative z-10 text-center px-6 py-10 sm:py-14">
          <p
            className="text-white/90 mb-2 sm:mb-3 leading-tight"
            style={{ fontSize: "clamp(1.8rem, 6vw, 3.5rem)", fontFamily: "serif" }}
            lang="ar"
            dir="rtl"
          >
            رمضـــــان في دبي
          </p>
          <p
            className="text-white font-bold tracking-[0.15em] sm:tracking-[0.25em] uppercase"
            style={{ fontSize: "clamp(0.85rem, 2.5vw, 1.4rem)" }}
          >
            <span className="font-light bold-extrabold mr-1 tracking-normal" style={{ fontSize: "0.85em" }}>
              RAMADAN
            </span>{" "}
            in{" "}
            <span className="font-extrabold">DUBAI</span>
          </p>
        </div>
      </section>

      {/* ─── Content ─── */}
      <section className="flex-1 px-6 sm:px-10 py-10 sm:py-14">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-[#1a1a1a] font-bold leading-tight mb-8 sm:mb-10" style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)" }}>
            Wasl Employees Suhoor<br />Gathering
          </h1>

          <div className="space-y-5 text-[#4a4a4a] text-base sm:text-lg leading-relaxed">
            <p>Dear Colleagues,</p>

            <p>
              This is a friendly reminder and last chance to register for the Wasl Suhoor at
              Park Hyatt on 4 March. We look forward to welcoming you for a delightful
              evening, sharing Suhoor together in a warm and pleasant setting.
            </p>

            <p>
              Kindly confirm your attendance by registering through the link below at the
              earliest to help us finalize arrangements.
            </p>

            <p className="font-semibold text-[#1a1a1a]">
              Please note that a unique QR code will be sent to you upon successful
              registration to present upon arrival at the Suhoor event.
            </p>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-10 sm:mt-14">
            <Link
              href="/register"
              className="inline-block bg-[#c4952a] text-white font-bold text-sm tracking-[0.12em] uppercase px-12 py-4 rounded-full hover:bg-[#d4a844] active:scale-[0.98] transition-all duration-200"
            >
              Register Here
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Event Details Bar ─── */}
      <section className="bg-[#f5f0e8] border-t border-[#e8e0d0]">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center sm:text-left">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#8a7f6e] mb-2">
              Date
            </p>
            <div className="w-10 h-px bg-[#c4952a]/40 mb-3 mx-auto sm:mx-0" />
            <p className="text-[#1a1a1a] text-base font-medium">Wednesday</p>
            <p className="text-[#1a1a1a] text-base font-medium">4 March 2026</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#8a7f6e] mb-2">
              Time
            </p>
            <div className="w-10 h-px bg-[#c4952a]/40 mb-3 mx-auto sm:mx-0" />
            <p className="text-[#1a1a1a] text-base font-medium">9:30 PM - 12:30 AM</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#8a7f6e] mb-2">
              Location
            </p>
            <div className="w-10 h-px bg-[#c4952a]/40 mb-3 mx-auto sm:mx-0" />
            <p className="text-[#1a1a1a] text-base font-medium">Fountain Garden,</p>
            <p className="text-[#1a1a1a] text-base font-medium">Park Hyatt Dubai Creek</p>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[#1a1a1a] px-6 sm:px-10 py-8 sm:py-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Follow us */}
          <div className="flex flex-col items-center sm:items-start gap-3">
            <p className="text-white/40 text-xs tracking-wider">Follow us</p>
            <div className="flex items-center gap-4">
              {/* X / Twitter */}
              <a href="https://x.com/waaboreal" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors" aria-label="X (Twitter)">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              {/* Facebook */}
              <a href="https://facebook.com/waaboreal" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors" aria-label="Facebook">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              {/* Instagram */}
              <a href="https://instagram.com/waaboreal" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors" aria-label="Instagram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              {/* YouTube */}
              <a href="https://youtube.com/@waaboreal" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors" aria-label="YouTube">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              {/* LinkedIn */}
              <a href="https://linkedin.com/company/wasl" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors" aria-label="LinkedIn">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>

          {/* Wasl App */}
          <div className="flex flex-col items-center sm:items-end gap-3">
            <p className="text-white/40 text-xs tracking-wider">Wasl App</p>
            <div className="flex items-center gap-3">
              <a href="https://apps.apple.com/app/wasl/id1527498241" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 transition-colors rounded-lg px-3 py-2">
                <svg className="w-4 h-4 text-white/80" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <div className="text-left">
                  <p className="text-white/50 text-[8px] leading-none">Download on the</p>
                  <p className="text-white text-[11px] font-semibold leading-tight">App Store</p>
                </div>
              </a>
              <a href="https://play.google.com/store/apps/details?id=ae.wasl.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 transition-colors rounded-lg px-3 py-2">
                <svg className="w-4 h-4 text-white/80" fill="currentColor" viewBox="0 0 24 24"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.635-8.635z"/></svg>
                <div className="text-left">
                  <p className="text-white/50 text-[8px] leading-none">Get it on</p>
                  <p className="text-white text-[11px] font-semibold leading-tight">Google Play</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
