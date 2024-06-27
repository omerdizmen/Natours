import { login } from "./login";
import User from "../../models/userModel";
import axios from "axios";
import { showAlert } from "./alert";


// export const updateData = async (name, email) =>{
//     try{
//         const res = await axios({
//             method: "PATCH",
//             url:"",
//             data: {
//                 name,
//                 email
//             }
//         });
//     }
//     catch(err){
//         showAlert("error", err.reponse.data.message);   
//     }
// }

export const updateData = async (data, type) =>{
    try{
        const url = type === "password" ? "" : ""

        const res = await axios({
            method: "PATCH",
            url:"",
            data: {
                name,
                email
            }
        });
    }
    catch(err){
        showAlert("error", err.reponse.data.message);   
    }
}
