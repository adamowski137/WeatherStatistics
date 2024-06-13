import {useState, useEffect} from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import {Box, Button, Typography} from '@mui/material';


function StatisticsTest() {
        
    const addres = "http://localhost:5000/api";
    const [data, setData] = useState([]);
    const [currentYear, setCurrentYear] = useState(0);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(addres);
                const data = await response.json();
                setData(data);
                setCurrentYear(data[0].year);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const handlePlay = () => {
        const maxYear = Math.max(...data.map(item => item.year));
        let tmp = currentYear;
        const intervalId = setInterval(() => {
            tmp++;
            setCurrentYear(prevYear => prevYear + 1);
            if(tmp >= maxYear){
                setCurrentYear(data[0].year);
                clearInterval(intervalId);
            }
        }, 500);
    }


    return (
        <Box height={"100%"} width={"100%"} display="flex" alignItems="center" justifyContent="center" flexDirection="column">
            <Typography>This chart represents how temperature was changing in the span of 30 years</Typography>
            <LineChart
                xAxis={[{data: data.filter(item => item.year === currentYear).map(item => item.month)}]}
                yAxis={[{ min: Math.min(...data.map(item => item.temperature)), max: Math.max(...data.map(item => item.temperature)) }]}
                series={[{ data: data.filter(item => item.year === currentYear).map(item => item.temperature), showMark: false}]}
                grid={{ vertical: true, horizontal: true }}
            />
            <Typography>Year: {currentYear}</Typography>
            <Button variant="contained" onClick={handlePlay}>Play</Button>
        </Box>
    );
}

export default StatisticsTest;