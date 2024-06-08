import {useState, useEffect} from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import {Box, Button, Typography, Dialog, TextField} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

function Statistics1() {
        
    const addres = "http://localhost:5000/api/statistics1";
    const [data, setData] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [settings, setSettings] = useState({
        latitude: 52.52,
        longitude: 13.41,
        startDate: "1940-01-02",
        endDate: "2022-12-31"
    });
    const fetchData = async () => {
        try {
            const queryParams = new URLSearchParams(settings);
            const url = `${addres}?${queryParams}`;
            const response = await fetch(url);
            const data = await response.json();
            setData(data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);


    return (
        <Box height={"100%"} width={"100%"} display="flex" alignItems="center" justifyContent="center" flexDirection="column">
            <Typography>This chart represents how change of mean temperature affects the change of mean rainfall.
                <SettingsIcon onClick={() => setDialogOpen(true)} />
            </Typography>
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                <Box  display="flex"  justifyContent="center" flexDirection="column" gap="10px" padding="10px">
                    <Typography>Settings</Typography>
                    <TextField label="Latitude" type="number" value={settings.latitude} onChange={(e) => setSettings({...settings, latitude: e.target.value})} />
                    <TextField label="Longitude" type="number" value={settings.longitude} onChange={(e) => setSettings({...settings, longitude: e.target.value})} />
                    <TextField label="Start Date" type='date' value={settings.startDate} onChange={(e) => setSettings({...settings, startDate: e.target.value})} />
                    <TextField label="End Date" type='date' value={settings.endDate} onChange={(e) => setSettings({...settings, endDate: e.target.value})} />
                    <Button variant="contained" onClick={() => {
                        fetchData();
                        setDialogOpen(false);
                    }}>Apply</Button>
                </Box>
            </Dialog>

            <LineChart
                xAxis={[{data: data.map(item => item.temp_differerence), label: "Temperature difference [°C]"}]}
                yAxis={[{ label: "Rainfall Difference [mm]" }]}
                series={[{ data: data.map(item => item.mean_rain_difference), showMark: false}]}
                grid={{ vertical: true, horizontal: true }}
            />
        </Box>
    );
}

export default Statistics1;