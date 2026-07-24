export default function ProgressBar() {
  return (
    <div className="flex items-center gap-3">

      <div className="h-2 w-20 bg-green-600 rounded-full"/>

      <div className="h-2 w-20 bg-gray-200 rounded-full"/>

      <div className="h-2 w-20 bg-gray-200 rounded-full"/>

      <div className="h-2 w-20 bg-gray-200 rounded-full"/>

      <span className="ml-6 font-semibold">

        STEP 01/04

      </span>

    </div>
  );
}