/* 
    This file contains a list of all exercises with expected time per rep
    This file should be updated frequently to ensure accuracy and stay up to date
    with new exercises.

    Must put all inputs in lowercase, but this is covered if not
*/

export const timePerRep = {
    // Bodyweight movements
    bodyweight: {
    "push up": 0.8,
    "burpee": 2,
    "get up": 1.75,
    "air squat": 0.9,
    "pull up": 0.9,
    "chest to bar": 1.1,
    "sit up": 0.8,
    "toes to bar": 1,
    "mountain climber": 0.5, // per leg
    "plank shoulder tap": 1, // per tap
    "jumping jack": 1,
    "lunge": 1, // per leg
    "jump squat": 2,
    "high knees": 0.5, // per knee
    "wall sit": 1, // static hold – per minute
    "handstand push-up": 0.8,
    "box jump": 2,
    "step-up": 2.5, // per leg
    "broad jump": 3
    },

    // Weighted bodyweight movements
    weighted: {
    "deadlift": 1,
    "power clean": 0.8,
    "clean and jerk": 1.2,
    "snatch": 1.1,
    "front squat": 1.6,
    "back squat": 1.6,
    "overhead squat": 1,
    "push press": 0.8,
    "push jerk": 0.9,
    "thruster": 1,
    "dumbbell snatch": 1.1,
    "dumbbell clean and jerk": 2,
    "kettlebell swing": 1,
    "kb swing": 1,
    "kettlebell snatch": 1.1,
    "kb snatch": 1.1,
    "goblet squat": 1,
    "db goblet squat": 2
    },

    // Gymnastics/Calisthenics
    gymnastics: {
    "toes to bar": 0.8,
    "kipping pull-up": 0.7,
    "muscle up": 3,
    "handstand walk": 0.5, // per step
    "pistol squat": 1,
    "hollow rock": 0.6
    },

    // Conditioning / cardio machines
    // per m pace
    erg: {
    "row": 0.21, 
    "cal row": 2.75,
    "bike": 0.1,
    "c2": 0.1, 
    "cal bike": 3,
    "cal c2": 3,
    "run": 0.20, 
    "assault bike": 0.1, 
    "cal assault bike": 3,
    "ski": 0.25, 
    "cal ski": 2.85,
    "double under": 0.66,
    "single under": 0.8,
    "box step-over": 2.3,
    "db box step-over": 3.5
    },

    // Core and static holds
    core: {
    "plank hold": 1, // per minute
    "hollow hold": 1,
    "L sit": 1,
    "superman hold": 1
    },

    // Misc
    misc: {
    "sandbag clean": 4,
    "sled push": 0.3,
    "farmer carry": 0.5,
    "wall ball": 1.5,
    "devil's press": 3
    }
};


// add element to convert all to lowercase in case
for (const key in timePerRep) {
    if (timePerRep.hasOwnProperty(key)) {
        const value = timePerRep[key];
        // check if value is an object
        if (typeof value === 'object' && !Array.isArray(value)) {
            for (const subKey in value) {
                if (value.hasOwnProperty(subKey)) {
                    const subValue = value[subKey];
                    // convert to lowercase
                    timePerRep[key][subKey.toLowerCase()] = subValue;
                }
            }
        }
    }
}
// Object.keys(timePerRep).forEach(key => {
//     timePerRep[key.toLowerCase()] = timePerRep[key];
// });