import express from 'express';
import axios from 'axios';

const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/', async (req, res) => {
    try {
        // const response = await axios.get('https://api.example.com/data');
        res.render('index.ejs'); //, { data: response.data });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error occurred while fetching data');
    }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});