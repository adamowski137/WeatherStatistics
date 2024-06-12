import {useState, useEffect} from 'react';
import { Box } from '@mui/material';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import StatisticsTest from './StatisticsTest';
import Statistics1 from './Statistics1';
import Forecasts from './Forecasts';
import Differences from './Differences';

function App() {
const [currentTab, setCurrentTab] = useState(0);

const handleChange = (newValue) => {
    setCurrentTab(newValue);
}


return (
    <Box sx={{ width: '100vw', height: '100vh' }} padding={0} margin={0} left={0} display="flex" flexDirection="column" overflow="auto" position="fixed">
        <Tabs 
            value={currentTab} 
            onChange={(e, newValue) => handleChange(newValue)} 
            aria-label="basic tabs example"
            bgcolor="black"
            >
            <Tab label="Statistic Test" value={0}/>
            <Tab label="Statistic 1" value={1}/>
            {/* <Tab label="Statistic 2" value={2}/> */}
            <Tab label="Forecasts and archive" value={3}/>
            <Tab label="Difference by hour" value={4}/>
        </Tabs>
        <Box sx={{ width: '100%', height: "calc(100% - 60px)", display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            {currentTab === 0 && <StatisticsTest />}
            {currentTab === 1 && <Statistics1 />}
            {/* {currentTab === 2 && <Statistics3 />} */}
            {currentTab === 3 && <Forecasts/>}
            {currentTab === 4 && <Differences/>}
        </Box>
    </Box>  
);
}

export default App;