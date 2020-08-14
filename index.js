#! /usr/bin/env node

//remember to start this use: `node ./index.js`
//starting this db stuff:  npx json-server ./db.json --port 3001
const { default: axios } = require('axios');

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'enter value > '
});

readline.prompt();

readline.on('line', async line => {
    switch (line.trim()) {
        case 'list vegan foods':
            {
                const { data } = await axios.get(`http://localhost:3001/food`);
                function* listVeganFood() {

                    let idx = 0;
                    const veganOnly = data.filter(food =>
                        food.dietary_preferences.includes('vegan'),
                    );
                    while (veganOnly[idx]) {
                        yield veganOnly[idx];
                        idx++;
                    }
                }

                for (let val of listVeganFood()) {
                    console.log(val.name);
                }
                readline.prompt();

            }
            break;
        case 'log':
            {
                const { data } = await axios.get('http://localhost:3001/food');
                const it = data[Symbol.iterator]();
                let actionIt;

                function askForServingSize() {
                    readline.question(`How many servings did you eat? (as decimal: 1, 0.5, 1.25, etc) `,
                        servingSize => {
                            if (servingSize === 'nevermind' || servingSize === 'n') {
                                actionIt.return();

                            } else {
                                actionIt.next(servingSize);
                            }
                        },
                    );
                }

                function* actionGenerator() {
                    const food = yield;
                    const servingSize = yield askForServingSize();
                    yield displayCalories(servingSize, food);

                }

                async function displayCalories(servingSize, food) {
                    const calories = food.calories;
                    console.log(`${food.name} with serving size of ${servingSize} has a ${Number.parseFloat(
                        calories * parseInt(servingSize, 10)).toFixed()} calories. `);
                    const { data } = await axios.get('http://localhost:3001/users/1');
                    const usersLog = data.log || [];
                    const putBody = {
                        ...data,
                        log: [
                            ...usersLog,
                            {
                                [Date.now()]: {
                                    food: food.name,
                                    servingSize,
                                    calories: Number.parseFloat(
                                        calories * parseInt(servingSize, 10),
                                    )
                                }
                            }
                        ]
                    }
                    await axios.put(`http://localhost:3001/users/1`,
                        putBody,
                        {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    )
                    actionIt.next();
                    readline.prompt();
                }


                readline.question(`What would you loke to log today? `, async (item) => {
                    let position = it.next();
                    while (!position.done) {
                        const food = position.value.name;
                        if (food === item) {
                            console.log(`${item} has ${position.value.calories} calories`);
                            actionIt = actionGenerator();
                            actionIt.next();
                            actionIt.next(position.value);
                        }
                        position = it.next();
                    }
                })
                break;
            }
        case `today's log`: {
            readline.question('Email: ', async emailAdress => {
                const { data } = await axios.get(
                    `http://localhost:3001/users?email=${emailAdress}`
                );
                const foodLog = data[0].log || [];
                let totalCalories = 0;

                function* getFoodLog() {
                    yield* foodLog;
                }

                for (const entry of getFoodLog()) {
                    const timestamp = Object.keys(entry)[0];
                    if (isToday(new Date(Number(timestamp)))) {
                        console.log(
                            `${entry[timestamp].food}, ${entry[timestamp].servingSize} serving(s)`
                        )
                        totalCalories += entry[timestamp].calories;
                    }
                }
                console.log('-------------------');
                console.log(`Total Calories: ${totalCalories}`);
                readline.prompt();
            })
            break;
        }
            readline.prompt(); //here or maybe after next }
    }
});

function isToday(timestamp) {
    const today = new Date();
    return (
        timestamp.getDate() === today.getDate() &&
        timestamp.getMonth() === today.getMonth() &&
        timestamp.getFullYear() === today.getFullYear()
    );
}
