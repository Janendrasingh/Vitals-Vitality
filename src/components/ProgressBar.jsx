export default function ProgressBar() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-20 bg-linear-to-r from-[#2B7C32] to-lime-400 rounded-full" />

      <div className="h-2 w-20 bg-gray-200 rounded-full" />

      <div className="h-2 w-20 bg-gray-200 rounded-full" />

      <div className="h-2 w-20 bg-gray-200 rounded-full" />

      <span className="ml-6 text-sm font-bold tracking-[4px] uppercase font-['Space_Grotesk']">
        STEP 01/04
      </span>
    </div>
  );
}
