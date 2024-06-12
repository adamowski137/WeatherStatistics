import { useState, useEffect } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Box, Typography, TextField, Switch, Checkbox } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Grid from '@mui/material/Grid';

function Differences() {

    const forecastAddress = "http://localhost:5000/api/archive-forecast/diff-by-hour";
    const diffAddress = "http://localhost:5000/api/archive-forecast/soft-diff-by-hour";
    let address;
    const [series, setSeries] = useState([]);
    const [xAxis, setX] = useState([]);
    const [yAxis, setY] = useState([]);
    const [isSwitched, setSwitch] = useState(false)
    const [settings, setSettings] = useState({
        latitude: 52.52,
        longitude: 13.41,
        pastDays: 14,
        model: "ecmwf_ifs04"
    });
    const [displaySettings, setDisplaySettings] = useState({
        "temperature_2m": true,
        "apparent_temperature": true,
        "relative_humidity_2m": true,
        "precipitation": true
    })
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
            if (isSwitched) {
                address = diffAddress
                setY([{ label: "Relative difference" }])
            }
            else {
                address = forecastAddress
                setY([{ label: "Difference" }])
            }
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
        const series = 
        setSeries(
            Object.keys(fieldNames)
                .filter(key => displaySettings[key])
                .map(key => {
                    return {
                        data: data.map(item => item[key]),
                        id: key,
                        label: fieldNames[key],
                        showMark: false
                    }}))
        setX([{
            data: data.map(item => item.date),
            label: "Hour of a day",
        }])
    }
    useEffect(() => {
        fetchData();
    }, [isSwitched, settings, displaySettings]);

    useEffect(() => {
        updateChart();
    }, [data])

    const handleSwitch = (e) => {
        setSwitch(e.target.checked)
    }
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings((prevSettings) => ({
            ...prevSettings,
            [name]: value,
        }));
    }
    const handleDisplaySettings = (e) => {
        const { name, checked } = e.target;
        setDisplaySettings((prevSettings) => ({
            ...prevSettings,
            [name]: checked,
        }));
    }

    return (
        <Box height={"100%"} width={"100%"} display="flex" alignItems="center" justifyContent="center" flexDirection="column">
            <FormControl component="fieldset" variant="standard" >
                <Typography>This chart represents average difference between forcasts and actual weather grouped by hour of a day.</Typography>
                <FormGroup>
                    <FormControlLabel
                        control={
                            <Switch name="diffSwitch" onChange={handleSwitch} checked={isSwitched} />
                        }
                        label="Apply soft-max"
                    />
                    <Grid container spacing={2} sx={{ width: '100%', marginBottom: 2 }} alignItems="center">
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
                                    {models.map(model => <MenuItem value={model}>{model}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </FormGroup>
            </FormControl>
            <FormControl>
                <Box display="flex" flexDirection="row" justifyContent="center">
                    {
                        Object.keys(fieldNames).map((key, index) =>
                            <FormControlLabel
                                value="top"
                                control={<Checkbox
                                    checked={displaySettings[key]}
                                    onChange={handleDisplaySettings}
                                    name={key}
                                />}
                                label={fieldNames[key]}
                                labelPlacement="end"
                            />
                        )
                    }
                </Box>
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

export default Differences;