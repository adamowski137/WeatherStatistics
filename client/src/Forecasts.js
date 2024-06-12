import {useState, useEffect} from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import {Box, Button, Typography, Dialog, TextField} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

function Forecasts() {
        
    const addres = "http://localhost:5000/api/archive-forecast";
    const [archive, setArchive] = useState([]);
    const [forecast, setForecast] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [settings, setSettings] = useState({
        latitude: 52.52,
        longitude: 13.41,
        pastDays: 14,
        model: "ecmwf_ifs04"
    });
    const fetchData = async () => {
        try {
            const queryParams = new URLSearchParams(settings);
            const url = `${addres}?${queryParams}`;
            const response = await fetch(url);
            const data = await response.json();
            console.log(data.archive)
            console.log(data.forecast)
            setArchive(data.archive);
            setForecast(data.forecast);
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
                xAxis={[{data: archive.map(item => new Date(item.date)), label: "Temperature difference [°C]"}]}
                yAxis={[{ label: "Rainfall Difference [mm]" }]}
                series={[
                    { data: archive.map(item => item.temperature_2m), showMark: false},
                    { data: forecast.map(item => item.temperature_2m), showMark: false}
                ]}
                grid={{ vertical: true, horizontal: true }}
            />
        </Box>
    );
}

export default Forecasts;