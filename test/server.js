let express =require('express'); 

const app = express();

app.use(express.json());

const port = 3000;

app.use(express.json());

app.listen(port, () => {
    console.log(`Test server listening at http://localhost:${port}`);
});


app.get("/api/v1/stress/:time", (req, res) => {
    setTimeout(()=>{
        res.sendStatus(200);
    },req.params.time || 1000);
});

app.get("/", (req, res) => {
    res.sendStatus(200);
});

