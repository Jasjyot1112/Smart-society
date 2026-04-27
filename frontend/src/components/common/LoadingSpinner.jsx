const LoadingSpinner = ({ fullScreen = false, size = 'md', text = '' }) => {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-dark-950 flex flex-col items-center justify-center z-50">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-dark-700"></div>
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary-500 border-t-transparent spinner"></div>
        </div>
        <div className="mt-6 text-center">
          <p className="text-xl font-bold gradient-text">Smart Society ERP</p>
          <p className="text-slate-400 text-sm mt-1">{text || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <div className={`${sizes[size]} rounded-full border-2 border-dark-700 border-t-primary-500 spinner`}></div>
      {text && <span className="text-slate-400 text-sm">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
