const FirstStep = () => {
  return (
    <div className="border-b border-white/10 pb-12">
      <h2 className="text-base/7 font-semibold text-white">
        Personal Information
      </h2>
      <p className="mt-1 text-sm/6 text-gray-400">
        Use a permanent address where you can receive mail.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label
            for="first-name"
            className="block text-sm/6 font-medium text-white"
          >
            First name
          </label>
          <div className="mt-2">
            <input
              id="first-name"
              type="text"
              name="first-name"
              autocomplete="given-name"
              className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstStep;
