export default function TopAppBar() {
  return (
    <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl w-full flex justify-between items-center px-8 py-4 border-b border-outline-variant/20">
      <div className="flex items-center gap-4">
        <span className="text-xl font-black tracking-tighter text-on-surface md:hidden">
          GenesisGym
        </span>
        <div className="hidden md:flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full outline outline-1 outline-outline-variant/20 focus-within:outline-primary transition-all">
          <span className="material-symbols-outlined text-on-surface-variant">search</span>
          <input
            className="bg-transparent border-none focus:outline-none text-sm text-on-surface placeholder-on-surface-variant w-64"
            placeholder="Buscar..."
            type="text"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2 text-on-surface/70 hover:bg-primary-container/10 hover:text-primary rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="p-2 text-on-surface/70 hover:bg-primary-container/10 hover:text-primary rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden border-2 border-surface-container-lowest cursor-pointer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Avatar del administrador"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqBcP30JiZLfQFhKoKRW1O6WsP6mGXW0Il-6ogD3S7Gt10bwbKO1NXOjmrNFVaDzudXqexWLtDGQEcAFFC8U0Qind-w2dsrZxOhltjDKJFGCvHO4lT0xVAScAN_Iv6KJixY-4mlD5bz_-FDjgI_c24thKVFBkX_gP4bQpoylH9mruglcOwG14kuJXE9P7qjnvEw8Y6SF4qdxQRMQoSYK_dcDbbzMLKggXZjOrblQXBQAjo3QvcSAfosewGcUINaszb4q9R55kJZjE"
          />
        </div>
      </div>
    </header>
  );
}
