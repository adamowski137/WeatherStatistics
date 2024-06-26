import { useState, useEffect } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Box, Typography, TextField, Switch } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Grid from '@mui/material/Grid';

function Forecasts() {

    const forecastAddress = "http://localhost:5000/api/archive-forecast";
    const diffAddress = "http://localhost:5000/api/archive-forecast/diff";
    let address;
    const [series, setSeries] = useState([]);
    const [xAxis, setX] = useState([]);
    const [yAxis, setY] = useState([]);
    const [isSwitched, setSwitch] = useState(false)
    const [field, setField] = useState("temperature_2m")
    const [settings, setSettings] = useState({
        latitude: 52.52,
        longitude: 13.41,
        pastDays: 14,
        model: "ecmwf_ifs04"
    });
    const [data, setData] = useState()
    const fieldNames = {
        "temperature_2m": "Temperature [°C]",
        "apparent_temperature": "Apparent temperature [°C]",
        "relative_humidity_2m": "Relative humidity [%]",
        "precipitation": "Precipitation [mm]"
    }
    const models = ["icon_seamless", "icon_global", "icon_eu", "icon_d2", "gfs_seamless", "gfs025", "gfs05", "ecmwf_ifs04", "ecmwf_ifs025", "gem_global", "bom_access_global_ensemble"]
    const fetchData = async () => {
        try {
            const queryParams = new URLSearchParams(settings);
            if (isSwitched)
                address = diffAddress
            else
                address = forecastAddress
            const url = `${address}?${queryParams}`;
            const response = await fetch(url);
            const data = await response.json();
            setData(data)
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const updateChart = () => {
        if (!data) return
        setY([{ label: fieldNames[field] }])
        if (isSwitched) {
            setSeries([
                { data: data.map(item => item[field]), label: 'Difference', showMark: false },
            ])
            setX([{
                data: data.map(item => new Date(item.date)),
                label: "Date",
                scaleType: "time"
            }])
        }
        else {
            setSeries([
                { data: data.archive.map(item => item[field]), label: 'Archive', showMark: false },
                { data: data.forecast.map(item => item[field]), label: 'Forecast', showMark: false }
            ])
            setX([{
                data: data.archive.map(item => new Date(item.date)),
                label: "Date",
                scaleType: "time",
                tickMinStep: 3600 * 1000 * 24
            }])
        }
    }
    useEffect(() => {
        fetchData();
    }, [isSwitched, settings]);

    useEffect(() => {
        updateChart();
    }, [data, field])
    const handleSwitch = (e) => {
        setSwitch(e.target.checked)
    }
    const handleSelect = (e) => {
        setField(e.target.value)
    }
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings((prevSettings) => ({
        ...prevSettings,
        [name]: value,
        }));
    }

    return (
        <Box height={"100%"} width={"100%"} display="flex" alignItems="center" justifyContent="center" flexDirection="column">
            <FormControl component="fieldset" variant="standard" >
                <Typography>This chart represents difference between forcasts and actual weather.</Typography>
                <FormGroup>
                    <FormControlLabel
                        control={
                            <Switch name="diffSwitch" onChange={handleSwitch} checked={isSwitched} />
                        }
                        label="Show difference"
                    />
                    <Grid container spacing={2} sx={{ width: '100%', marginBottom: 2 }} alignItems="center">
                        <Grid item xs={4} sm={3}>
                            <FormControl fullWidth>
                            <Select
                                value={field}
                                label="Component"
                                onChange={handleSelect}
                                sx={{ marginTop: '1px' }}
                                
                            >
                                {Object.keys(fieldNames).map(
                                    (key, index) => <MenuItem value={key}>{fieldNames[key]}</MenuItem>
                                )}
                            </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={4} sm={2}>
                            <TextField
                                fullWidth
                                label="Latitude"
                                type="number"
                                value={settings.latitude}
                                onChange={handleChange}
                                name="latitude"
                            />
                        </Grid>
                        <Grid item xs={4} sm={2}>
                            <TextField
                                fullWidth
                                label="Longitude"
                                type="number"
                                value={settings.longitude}
                                onChange={handleChange}
                                name="longitude"
                            />
                        </Grid>
                        <Grid item xs={4} sm={2}>
                            <TextField
                                fullWidth
                                label="Number of past days"
                                type="number"
                                value={settings.pastDays}
                                onChange={handleChange}
                                name="pastDays"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>
                        <Grid item xs={4} sm={2}>
                            <FormControl>
                            <Select
                                value={settings.model}
                                label="Component"
                                onChange={handleChange}
                                name="model"
                                sx={{ marginTop: '1px' }}
                            >
                                { models.map(model => <MenuItem value={model}>{model}</MenuItem>) }
                            </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </FormGroup>
            </FormControl>
            <LineChart
                xAxis={xAxis}
                yAxis={yAxis}
                series={series}
                grid={{ vertical: true, horizontal: true }}
            />
        </Box>
    );
}

export default Forecasts;