export default function ActivityCard({title,active}){

return(

<div
className={`rounded-2xl p-6 border cursor-pointer transition

${active

? "border-green-600"

: "border-gray-200"

}`}

>

<h2 className="font-bold">

{title}

</h2>

</div>

)

}