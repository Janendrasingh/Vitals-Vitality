export function calculateNutrition(data){

    if (!data || !data.weight || !data.height || !data.age || !data.gender) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    const weight = Number(data.weight);
    const height = Number(data.height);
    const age = Number(data.age);

    if (!Number.isFinite(weight) || !Number.isFinite(height) || !Number.isFinite(age)) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    let bmr;

    if(data.gender==="Male"){

        bmr =
        10*weight+
        6.25*height-
        5*age+
        5;

    }else{

        bmr =
        10*weight+
        6.25*height-
        5*age-
        161;

    }

    let activity;

    switch(data.activity){

        case "Moderate":
            activity=1.55;
            break;

        case "Very Active":
            activity=1.725;
            break;

        default:
            activity=1.2;

    }

    let calories=bmr*activity;

    switch(data.goal){

        case "Weight Loss":
            calories-=500;
            break;

        case "Muscle Gain":
            calories+=300;
            break;

        default:
            break;

    }

    calories=Math.round(calories);

    const protein=Math.round((calories*0.30)/4);

    const carbs=Math.round((calories*0.40)/4);

    const fat=Math.round((calories*0.30)/9);

    return{

        calories,
        protein,
        carbs,
        fat

    };

}
