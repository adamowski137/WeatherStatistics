import {useState, useEffect} from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import {Box, Button, Typography, Dialog, TextField, Stack} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';

function Temperature() {
        
    const addres = "http://localhost:5000/api/statistics1";
    const [dialogOpen, setDialogOpen] = useState(false);
    const [series, setSeries] = useState([]);
    const [seriesSettings, setSeriesSettings] = useState([{
        id: 1, 
        name: "Warsaw",
        latitude: 52.52,
        longitude: 21,
        startDate: "1940-01-02",
        endDate: "2022-12-31"
    }]);
    const fetchData = async () => {
        try {
            const newSeries = [];
            for (let i = 0; i < seriesSettings.length; i++) {
                const queryParams = new URLSearchParams(seriesSettings[i]);
                const url = `${addres}?${queryParams}`;
                const response = await fetch(url);
                const data = await response.json();
                newSeries.push({
                    id: seriesSettings[i].id,
                    name: seriesSettings[i].name,
                    data: data
                });
            }
            setSeries(newSeries);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);

    const handleNameChange = (id, value) => {
        const updatedseriesSettings = seriesSettings.map((item) => {
            if (item.id === id) {
                return { ...item, name: value };
            }
            return item;
        });
        setSeriesSettings(updatedseriesSettings);
    };

    const handleLatitudeChange = (id, value) => {
        const updatedseriesSettings = seriesSettings.map((item) => {
            if (item.id === id) {
                return { ...item, latitude: value };
            }
            return item;
        });
        setSeriesSettings(updatedseriesSettings);
    };

    const handleLongitudeChange = (id, value) => {
        const updatedseriesSettings = seriesSettings.map((item) => {
            if (item.id === id) {
                return { ...item, longitude: value };
            }
            return item;
        });
        setSeriesSettings(updatedseriesSettings);
    }

    const handleStartDateChange = (id, value) => {
        const updatedseriesSettings = seriesSettings.map((item) => {
            if (item.id === id) {
                return { ...item, startDate: value };
            }
            return item;
        });
        setSeriesSettings(updatedseriesSettings);
    }

    const handleEndDateChange = (id, value) => {
        const updatedseriesSettings = seriesSettings.map((item) => {
            if (item.id === id) {
                return { ...item, endDate: value };
            }
            return item;
        });
        setSeriesSettings(updatedseriesSettings);
    }

    const getXAxis = () => {
        const unique = new Set(series.map(x => x.data.map(item => item.temp_differerence)).flat());
        return [...unique];
    }

    const getYAxis = (ser) => {
        const result = [];
        const xAxis = getXAxis();
        for (let i = 0; i < xAxis.length; i++) {
            if(!ser.data.map(item => item.temp_differerence).includes(xAxis[i])){
                result.push(null);
                continue;
            }
            result.push(ser.data.find(item => item.temp_differerence === xAxis[i]).mean_rain_difference);
        }

        return result;
    }
     
    return (
        <Box height={"100%"} width={"100%"} display="flex" alignItems="center" justifyContent="center" flexDirection="column">
            <Box display="flex" gap="10px">
                <Typography>
                    This chart represents how change of mean temperature affects the change of mean rainfall.
                </Typography>
                <SettingsIcon   onClick={() => setDialogOpen(true)} style={{ fontSize: "larger", alignSelf: "center" }} />
            </Box>
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                <Box  display="flex"  justifyContent="center" flexDirection="column" gap="10px" padding="10px">
                    <Stack direction="column">
                        {seriesSettings.map(x => 
                        <Accordion>
                            <AccordionSummary>
                                <Box display="flex" justifyContent="space-between" width="100%">
                                    <Typography>{x.name}</Typography>
                                    <RemoveCircleOutlineIcon onClick={() => setSeriesSettings(seriesSettings.filter(y => y.id !== x.id))} />
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box  display="flex"  justifyContent="center" flexDirection="column" gap="10px" padding="10px">
                                    <TextField label="Name" type="text" value={x.name} onChange={(e) => handleNameChange(x.id, e.target.value)}/>
                                    <TextField label="Latitude" type="number" value={x.latitude} onChange={(e) => handleLatitudeChange(x.id, e.target.value)} />
                                    <TextField label="Longitude" type="number" value={x.longitude} onChange={(e) => handleLongitudeChange(x.id, e.target.value)} />
                                    <TextField label="Start Date" type='date' value={x.startDate} onChange={(e) => handleStartDateChange(x.id, e.target.value)} />
                                    <TextField label="End Date" type='date' value={x.endDate} onChange={(e) => handleEndDateChange(x.id, e.target.value)} />
                                </Box>  
                            </AccordionDetails>
                        </Accordion>)}
                        <Button variant="contained" onClick={() => setSeriesSettings([...seriesSettings, {id: Math.max(seriesSettings.map(x => x.id)) + 1, name: "Warsaw", latitude: 52.52, longitude: 21, startDate: "1940-01-02", endDate: "2022-12-31"}])}>
                            <AddCircleOutlineIcon />
                        </Button>
                    </Stack>
                    <Typography>Settings</Typography>
                    <Button variant="contained" onClick={() => {
                        fetchData();
                        setDialogOpen(false);
                    }}>Apply</Button>
                </Box>
            </Dialog>
            <LineChart
                xAxis={[{data: getXAxis(), label: "Temperature difference [°C]"}]}
                yAxis={[{ label: "Rainfall Difference [mm]" }]}
                series={series.map(x => ({data: getYAxis(x), showMark: false, label: x.name, id: x.id}))}
                grid={{ vertical: true, horizontal: true }}
            />
        </Box>
    );
}

export default Temperature;