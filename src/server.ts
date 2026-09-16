
import app from "./app";



// Start the server


const bootstrap =  () => {
  
    try{
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT || 5000}`);
});
    }catch(err){
        console.error("Error starting the server:", err);
    }   
}

bootstrap();