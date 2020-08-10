#! /usr/bin/env node


//todo: create custom user iterator ?? 
//dodawanie userow??
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
                axios.get(`http://localhost:3001/food`).then(({ data }) => {
                    let idx = 0;
                    const veganOnly = data.filter(food => {
                        return food.dietary_preferences.includes('vegan');
                    })
                    const veganIterable = {
                        [Symbol.iterator]() {
                            return {
                                [Symbol.iterator]() {
                                    return this;
                                },
                                next() {
                                    const current = veganOnly[idx];
                                    idx++;
                                    if (current) { //if it is undefined then it is false
                                        return { value: current, done: false };
                                    }
                                    else {
                                        return { value: current, done: true };

                                    }
                                },
                            };
                        },

                    };
                    for (let val of veganIterable) {
                        console.log(val.name);
                    }
                    readline.prompt();
                });
            }
            break;
        case 'log':
            {
                const { data } = await axios.get('http://localhost:3001/food');
                const it = data[Symbol.iterator]();
                let actionIt;


                const actionIterator = {

                    [Symbol.iterator]() {
                        let positions = [...this.actions];
                        return {
                            [Symbol.iterator]() {
                                return this;
                            },
                            next(...args) {
                                if (positions.length > 0) {
                                    const position = positions.shift();
                                    const result = position(...args);
                                    return { value: result, done: false }
                                } else {
                                    return { done: true }
                                }
                            },
                            return() {
                                positions = [];
                                return { done: true };
                            },
                            throw(error) {
                                console.log(error);
                                return { value: undefined, done: true };
                            }
                        };
                    },
                    actions: [askForServingSize, displayCalories],
                };
                function askForServingSize(food) {
                    readline.question(`How many servings did you eat? (as decimal: 1, 0.5, 1.25, etc) `,
                        servingSize => {
                            if (servingSize === 'nevermind' || servingSize === 'n') {
                                actionIt.return();

                            } else {
                                actionIt.next(servingSize, food);
                            }
                        },
                    );



                }

                async function displayCalories(servingSize, food) {
                    const calories = food.calories;
                    //here check values 
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
                            actionIt = actionIterator[Symbol.iterator]();
                            actionIt.next(position.value);
                        }
                        position = it.next();
                    }
                    // readline.prompt();
                })
                break;
            }
        case 'users': {
            const { data } = await axios.get('http://localhost:3001/users');
            // data.forEach(user => {
            //     console.log(user.firstname + ' ' + user.lastname);
            // });

            readline.prompt();
            break;
        }
        case 'iter': {
            axios.get(`http://localhost:3001/users`).then(({ data }) => {
                let idx = 0;
                const proUserOnly = data.filter(user => {
                    return user.id % 2 === 1;
                })
                for (let user of proUserOnly) {
                    console.log(user.firstname + ' ' + user.lastname);
                }
                readline.prompt();
            });
            break;
        }
        case 'addUser': {
            const { data } = await axios.get('http://localhost:3001/users');
            const putBody = {
                ...data,
                [Date.now()]: {
                    id: 4,
                    firstname: 'Adam',
                    lastname: 'Testowniak',
                    email: 'test@test.com'

                }

            }
            await axios.put(`http://localhost:3001/users`,
                putBody,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('user poszedl w swiat!!!');
            readline.prompt();

        }

    }
})


