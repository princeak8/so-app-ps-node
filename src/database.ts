import { DataSource } from "typeorm"
const ormConfig = require("./config/ormconfig").default;

export const dataSource = new DataSource(ormConfig);

// export default dataSource.initialize()
//     .then(() => {
//     dataSource.synchronize(true); 
//     console.log('Database initialized');
//     })
//     .catch((err) => console.log("Error initializing database: ", err));

    export default async () => {
        try{
            await dataSource.initialize();
            console.log('Database initialized');
        }catch(err) {
            console.log("Error initializing database: ", err);
        }
    }
// interface DbInterface {
//     DB : DataSource;
//     DbManager: DataSource["manager"];
//     initialize: Function
// }

// const res:DbInterface = {
//     "DB" : dataSource,
//     "DbManager": dataSource.manager,
//     "initialize": initialize
// };

// export default res;