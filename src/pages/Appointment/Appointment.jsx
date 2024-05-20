import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import dayjs from "dayjs";
import 'react-day-picker/dist/style.css';
import './Appointment.css';
import { LocalizationProvider, StaticTimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { appointmentCreate, bringAllStylists, bringAllTreatments } from "../../services/apiCalls";
import { useSelector } from "react-redux";
import { getUserData } from "../../app/slice/userSlice";
import { useNavigate } from "react-router-dom";
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import { FcOk } from "react-icons/fc";

//--------------------------------------------------------------------------

export const Appointment = () => {
  const now = dayjs();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [msg, setMsg] = useState("");
  const [msgV, setMsgV] = useState("");

  const [treatments, setTreatments] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appCreate, setAppCreate] = useState({
    appointmentDate: "",
    stylistId: "",
    treatsmentId: "",
  });

  const navigate = useNavigate()
  const myPassport = useSelector(getUserData);
  const token = myPassport.token;
  
  //Control de dias 
  const manageDate = (date) => {
    if (dayjs(date).diff(now, "d") <= 0 && dayjs(date).day() === 0 || dayjs(date).day() === 6) {
      setMsg("No puedes seleccionar una fecha anterior a la actual o fin de semana");
      setSelectedDate(null);
      return;
    }
    setMsg("");
    setSelectedDate(dayjs(date));
  };
  //Control de horas
  const manageTime = (time) => {
    if(dayjs(time).hour() < 8 || dayjs(time).hour() < 20)
      setMsg("El horario es: 08:00h a 20:00h")
    setSelectedTime(time);
  };
  
  const dateForMe = async () => {
    if (!appCreate.stylistId || !appCreate.treatsmentId || !selectedDateTime) {
      setMsg("Por favor selecciona un estilista, un tratamiento y una fecha/hora.");
      return;
    }
    
    try {
      const res = await appointmentCreate({ ...appCreate, appointmentDate: selectedDateTime.toISOString() }, token);
      setMsgV("Cita creada con éxito")
      setTimeout(() => {
        navigate("/profile");
      }, 2000)
    } catch (error) {
      setMsg("Error al crear la cita");
    }
  };

  useEffect(() => {
    const fetchStylistAndJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await bringAllStylists(token);
        setStylists(res.data.stylists);
        const resp = await bringAllTreatments(token);
        setTreatments(resp.data.treatment);
      } catch (error) {
        setError("Error al traer datos");
      }
      setLoading(false);
    };
    fetchStylistAndJobs();
  }, [token]);

  const inputHandlerDates = (e) => {
    setAppCreate((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };


  const getSelectedDateTime = () => {
    if (selectedDate && selectedTime) {
      return selectedDate.hour(dayjs(selectedTime).hour()).minute(dayjs(selectedTime).minute());
    }
    return null;
  };

  const selectedDateTime = getSelectedDateTime();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="container">
      {selectedDateTime && (
        <Alert variant="success">
          Selected Date: {selectedDateTime.format("dddd, MMMM D, YYYY h:mm A")}
        </Alert>
      )}
      {msg && <Alert variant="danger">{msg}</Alert>}
      {msgV && <Alert variant="success">{msgV}</Alert>}
      <div className="content">
        <DayPicker
          mode="single"
          selected={selectedDate ? selectedDate.toDate() : undefined}
          onSelect={manageDate}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <StaticTimePicker
            displayStaticWrapperAs="desktop"
            value={selectedTime}
            onChange={manageTime}
          />
        </LocalizationProvider>
      </div>
      {selectedDateTime && (
        <div className="result">
          <Form.Control as="select" name="treatsmentId" onChange={inputHandlerDates} className="select">
            <option value="">Select Treatment</option>
            {treatments.map((job) => (
              <option value={job.id} key={job.id}>{job.treatsment} {job.price}€</option>
            ))}
          </Form.Control>
          <Form.Control
          as="select"
           name="stylistId" onChange={inputHandlerDates} className="select">
            <option value="">Select Stylist</option>
            {stylists.map((art) => (
              <option value={art.id} key={art.id}>{art.firstName}</option>
            ))}
          </Form.Control>
          <div>
          <FcOk className="btnOk" onClick={dateForMe}>Get Appointment</FcOk>
          </div>
        </div>
      )}
    </div>
  );
};
