import WeightInput from "./WeightInput";
import ActivitySlider from "./ActivitySlider";

export default function LifestyleSection({ formData, setFormData }){

const update = (field, value) => setFormData((previous) => ({ ...previous, [field]: value }));

return(

<div className="space-y-10">

<WeightInput

value={formData.targetWeight}
onChange={(value) => update("targetWeight", value)}

/>

<ActivitySlider

activity={formData.activityScore}
setActivity={(value) => update("activityScore", value)}

/>

<div>

<label className="block text-sm font-semibold uppercase text-gray-700 mb-3">

Describe your Typical Day

</label>

<textarea

rows={4}

value={formData.typicalDay}

onChange={(e)=>update("typicalDay", e.target.value)}

placeholder="e.g Office job, walk 30 mins daily, 3 gym sessions per week..."

className="w-full rounded-2xl bg-gray-100 p-5 resize-none outline-none focus:ring-2 focus:ring-green-600"

/>

</div>

</div>

);

}
