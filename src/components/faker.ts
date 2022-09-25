import { faker } from '@faker-js/faker';
//import { Phone } from '@faker-js/faker/modules/phone';

// also a great name generator:
// https://www.npmjs.com/package/namor

import { formatDistance } from 'date-fns'


// faker API documentation:
// https://fakerjs.dev/api/phone.html

export interface User {
    userId: string,
    name: string,
    //userName: string,
    password: string,

    address: string,
    zip: string,
    registeredAt: number,
    isMale: boolean,

    email: string,
    mobile: string,

    halal: boolean,
}


export interface Merchant {
    id: string,
    companyName: string,

    name: string,
    //userName: string,
    password: string,

    address: string,
    zip: string,
    registeredAt: number,
    isMale: boolean,

    email: string,
    web: string,
    mobile: string,
}


export interface Task {
    taskId: string,
    projectId: string,

    userId: string,
    staffId: string,

    checkIn: number | undefined,
    checkOut: number | undefined,

    reward: number | undefined,

    //completed: boolean,
}


export enum taskStatusEnum{
    working, finished 
}

export type taskStatusInterface = {
    [key in taskStatusEnum]: boolean;
};



export interface Project {
    projectId: string,
    name: string,
    //location: string,

    desc: string,
    url: string,
    email: string,

    reward: number,
}



export interface ProjectTasksView extends User, Task {

    projectId: string,

    projectName: string,

    // some easy to read status of checkIn / checkOut combinations
    status: string,

    //status: taskStatusInterface,

    //working: boolean,
    //finished: boolean,

}



export const USERS: User[] = [];

export function createRandomUser(): User {
  return {
    userId: faker.datatype.uuid(),
    //username: faker.internet.userName(),
    name: faker.name.lastName() + " " + faker.name.firstName(),
    password: faker.internet.password(),

    address: faker.address.streetAddress(true), // // '3393 Ronny Way Apt. 742'
    zip: faker.address.zipCode('####'), // '6925'
    registeredAt: new Date( faker.date.betweens('2020-01-01T00:00:00.000Z', '2022-09-01T00:00:00.000Z', 1)[0]).getTime(),
    isMale: Math.random() > 0.5,

    email: faker.internet.email(),
    mobile: faker.phone.number('+11 91 ### ## ##'), // '+48 91 463 61 70'

    halal: Math.random() > 0.5,
  };
}





export const TASKS: Task[] = [];

export function createRandomTask({ userId, projectId, staffId }): Task {
  return {

    taskId: faker.datatype.uuid(),
    projectId, //: faker.datatype.uuid(),

    userId, //: faker.datatype.uuid(),
    staffId, //: faker.datatype.uuid(),

    // 4h ~ 3h ago
    checkIn: new Date( faker.date.betweens(Date.now()-(1000*3600*4), Date.now()-(1000*3600*3), 1)[0]).getTime(),

    // 2h ~ 1h ago, only some users are checked out already..
    checkOut: Math.random() > 0.5 
        ? new Date( faker.date.betweens(Date.now()-(1000*3600*2), Date.now()-(1000*3600*1), 1)[0]).getTime() 
        : undefined,

    reward: Math.floor( 1+Math.random()*900), 

    //completed: boolean,

  };
}





export const PROJECTS: Project[] = [];

export function createRandomProject(): Project {
  return {

    projectId: faker.datatype.uuid(),
    name: "Project " + faker.word.noun() + " " + faker.vehicle.color(),
    //location: string,

    desc: faker.lorem.text(),

    url: faker.internet.domainName(), // 'slow-timer.info'
    email: faker.internet.email(), // 'Kassandra4@hotmail.com'

    reward: Math.floor( 1+Math.random()*900), 
  };
}


export const getTimeStr = (ts:number|undefined) => !ts ? "" : (new Date(ts)).toLocaleString("en-GB", { timeStyle: "medium", hour12: false})  //timeZoneName: "short" 

export const getDurationStr = (ts1:number|undefined, ts2:number|undefined) => !ts1 ? "" : !ts2 ? formatDistance( Date.now(), ts1 ) : formatDistance( ts2, ts1 )

export const maskMobile = ( mobile ) => mobile.replace(/([a-zA-Z0-9])/g, '*') + mobile.slice(-5)

export const maskEmail = (email) => {
    let str = email
    str = str.split('');
    let finalArr=[];
    let len = str.indexOf('@');
    str.forEach((item,pos)=>{
        (pos>=3 && pos<=len-2) ? finalArr.push('*') : finalArr.push(str[pos]);
    })
    return finalArr.join('')
}


export const PROJECTTASKS: ProjectTasksView[] = [];

export function createProjectTask( user: User, task: Task, projectName: string ): ProjectTasksView {
    return { 
        ...user, 
        ...task, 
        projectName, 
        status: task.checkIn && !task.checkOut 
            ? "working" 
            : !!task.checkOut 
                ? "finished"     // was "finished" before
                : null 
    }
    //  status: taskRec.checkOut ? [taskStatusEnum.finished]: true : [taskStatusEnum.working]: true

}

/*
    return { 
        ...user, 
        ...task, 
        projectName, 
        status: task.checkIn && !task.checkOut 
            ? "working" 
            : !!task.checkOut 
                ? "" + getDurationStr( task.checkIn, task.checkOut )    // was "finished" before
                : null 
    }
*/


// Array.from({ length: 20 }).forEach(() => {
//     TASKS.push(createRandomTask());
// });

Array.from({ length: 5 }).forEach(() => {
  PROJECTS.push(createRandomProject());
});





export const generateOneProjectTask = ({ projectIdx, staffIdx }) => {
    const userRec = createRandomUser()
    USERS.push(userRec);

    const projectId = PROJECTS[ projectIdx ].projectId
    const staffId = "Staff" + staffIdx
    const projectName = PROJECTS[ projectIdx ].name

    const taskRec = createRandomTask({ userId: userRec.userId, projectId, staffId })
    TASKS.push( taskRec )

    const projectTaskRec = createProjectTask( userRec, taskRec, projectName )

    return projectTaskRec
}



const projectIdx = Math.floor( Math.random()*(PROJECTS.length-1) )
const staffIdx = Math.floor( Math.random()*(PROJECTS.length-1) )

console.log('projectIdx:', projectIdx)
console.log('PROJECTS:', PROJECTS)

Array.from({ length: 20 }).forEach(() => {
    /*
    const userRec = createRandomUser()
    USERS.push(userRec);

    const projectId = PROJECTS[ projectIdx ].projectId
    const staffId = "Staff" + staffIdx
    const projectName = PROJECTS[ projectIdx ].name

    const taskRec = createRandomTask({ userId: userRec.userId, projectId, staffId })
    TASKS.push( taskRec )

    createProjectTask( userRec, taskRec, projectName )
    PROJECTTASKS.push( projectTaskRec )
*/
    const projectTaskRec = generateOneProjectTask({ projectIdx, staffIdx })  
    PROJECTTASKS.push( projectTaskRec )
     
});

console.log('PROJECTTASKS:', PROJECTTASKS)














