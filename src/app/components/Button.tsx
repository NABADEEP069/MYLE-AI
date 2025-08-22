

export const PrimaryButton = ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-black text-white px-4 py-2 rounded-full text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );


export  const OutlineButton = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button
      onClick={onClick}
      className="border border-black text-black px-4 py-2 text-sm rounded-full bg-transparent hover:bg-black/10 flex items-center gap-2 transition-colors"
    >
      {children}
    </button>
  );
