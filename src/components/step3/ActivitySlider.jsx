const labels=[
"Sedentary",
"Light",
"Moderate",
"Active",
"Vigorous",
];

export default function ActivitySlider({
  activity,
  setActivity,
}){

const getLabel=()=>{

if(activity<=20) return "Sedentary";
if(activity<=40) return "Light";
if(activity<=60) return "Moderately Active";
if(activity<=80) return "Active";

return "Vigorous";

};

return(

<div>

<div className="flex justify-between items-center mb-4">

<label className="text-sm font-semibold uppercase">

Daily Activity Level

</label>

<span className="text-2xl font-bold text-green-700">

{getLabel()}

</span>

</div>

<input

type="range"
min="0"
max="100"
value={activity}
onChange={(e)=>setActivity(Number(e.target.value))}
className="w-full accent-green-700 cursor-pointer"

/>

<div className="flex justify-between mt-3 text-xs uppercase text-gray-400">

{

labels.map(item=>(

<span key={item}>{item}</span>

))

}

</div>

</div>

);

}