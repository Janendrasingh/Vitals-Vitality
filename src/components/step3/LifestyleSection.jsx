import { useState } from "react";

import WeightInput from "./WeightInput";
import GoalSelector from "./GoalSelector";
import ActivitySlider from "./ActivitySlider";

export default function LifestyleSection(){

const[targetWeight,setTargetWeight]=useState("");

const[goal,setGoal]=useState("Maintain");

const[activity,setActivity]=useState(50);

const[description,setDescription]=useState("");

return(

<div className="space-y-10">

<WeightInput

value={targetWeight}
onChange={setTargetWeight}

/>

<GoalSelector

goal={goal}
setGoal={setGoal}

/>

<ActivitySlider

activity={activity}
setActivity={setActivity}

/>

<div>

<label className="block text-sm font-semibold uppercase text-gray-700 mb-3">

Describe your Typical Day

</label>

<textarea

rows={4}

value={description}

onChange={(e)=>setDescription(e.target.value)}

placeholder="e.g Office job, walk 30 mins daily, 3 gym sessions per week..."

className="w-full rounded-2xl bg-gray-100 p-5 resize-none outline-none focus:ring-2 focus:ring-green-600"

/>

</div>

</div>

);

}