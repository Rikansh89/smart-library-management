export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-3">
      <div className={`spinner ${sizes[size]}`}></div>
      {text && <p className="text-gray-500 text-sm">{text}</p>}
    </div>
  );
}
