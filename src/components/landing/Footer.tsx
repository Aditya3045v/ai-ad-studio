const Footer = () => {
  return (
    <footer className="flex flex-col gap-[37px] w-full px-5 py-5 overflow-hidden">
      {/* Brand Name */}
      <div className="flex flex-row gap-2.5 w-full items-center justify-center overflow-hidden">
        <h2
          className="text-[clamp(60px,12vw,190px)] leading-[0.8em] tracking-normal text-center whitespace-pre font-heading font-semibold"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          AdGen
        </h2>
      </div>

      {/* Divider */}
      <div className="w-full h-px" style={{ backgroundColor: "rgb(34, 34, 34)" }} />

      {/* Bottom Row */}
      <div className="flex flex-row gap-2.5 w-full items-end justify-end overflow-visible">
        {/* Copyright */}
        <div className="flex flex-col flex-1 items-start justify-center gap-2.5 overflow-hidden">
          <p
            className="text-sm leading-[1.1em]"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: "rgb(82, 82, 82)",
            }}
          >
            Copyright ©2025 Amo Pictures
          </p>
        </div>

        {/* Social Links */}
        <div className="flex flex-row flex-1 items-start justify-end gap-2.5 overflow-visible">
          {/* Instagram */}
          <a
            href="https://www.instagram.com/amopictures.official"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-2.5 rounded-[30px] no-underline transition-opacity duration-200 hover:opacity-80"
            style={{ backgroundColor: "rgb(28, 28, 28)" }}
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
                fill="rgb(179, 179, 179)"
                viewBox="0 0 16 16"
              >
                <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334" />
              </svg>
            </div>
          </a>

          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/company/amopictures/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-2.5 rounded-[30px] no-underline transition-opacity duration-200 hover:opacity-80"
            style={{ backgroundColor: "rgb(28, 28, 28)" }}
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
                viewBox="0 0 24 24"
              >
                <circle fill="rgb(179, 179, 179)" cx="4.983" cy="5.009" r="2.188" />
                <path
                  fill="rgb(179, 179, 179)"
                  d="M9.237 8.855v12.139h3.769v-6.003c0-1.584.298-3.118 2.262-3.118 1.937 0 1.961 1.811 1.961 3.218v5.904H21v-6.657c0-3.27-.704-5.783-4.526-5.783-1.835 0-3.065 1.007-3.568 1.96h-.051v-1.66H9.237zm-6.142 0H6.87v12.139H3.095z"
                />
              </svg>
            </div>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
