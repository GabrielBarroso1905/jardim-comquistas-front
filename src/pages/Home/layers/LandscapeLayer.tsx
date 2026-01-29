const LandscapeLayer = () => {
  return (
    <div className="relative w-full h-full">
      {/* Camadas de montanhas simples, em tons suaves */}
      <svg className="absolute bottom-0 w-full h-1/2" viewBox="0 0 1000 300" preserveAspectRatio="none">
        <g>
          <path d="M0,220 Q150,120 300,200 T600,200 T1000,180 L1000,300 L0,300 Z" fill="#6b7280" opacity="0.15" />
          <path d="M0,240 Q180,140 360,220 T720,220 T1000,200 L1000,300 L0,300 Z" fill="#4b5563" opacity="0.18" />
          <path d="M0,260 Q200,160 400,240 T800,240 T1000,220 L1000,300 L0,300 Z" fill="#374151" opacity="0.22" />
        </g>
      </svg>

      {/* Colina do primeiro plano e rio simples */}
      <svg className="absolute bottom-0 left-0 w-full h-1/3" viewBox="0 0 1000 200" preserveAspectRatio="none">
        <path d="M0,120 C200,40 400,40 600,120 C750,170 900,140 1000,120 L1000,200 L0,200 Z" fill="#4b774f" />
        <path d="M0,140 C200,80 400,80 600,140 C750,180 900,160 1000,140 L1000,200 L0,200 Z" fill="#6aa377" opacity="0.6" />
      </svg>

      {/* Pequenas plantas estilizadas no primeiro plano (formas simples) */}
      <div className="absolute bottom-6 left-8 w-12 h-12">
        <svg viewBox="0 0 24 24" className="w-full h-full">
          <g fill="#3b7a57">
            <ellipse cx="12" cy="18" rx="12" ry="6" opacity="0.12" />
            <path d="M12 6 C11 9 9 10 9 12 C10 11 12 11 13 12 C13 10 13 9 12 6 Z" />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default LandscapeLayer;
