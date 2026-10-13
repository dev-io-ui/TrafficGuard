import { useEffect, useState } from 'react';
import api from '../api/axios';

// Cascading Country -> State -> District -> Pincode (+ area). value = { state, district, pincode, area }
export default function GeoSelect({ value, onChange, pincode = true, area = true, required = true, lockState = false }) {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [pins, setPins] = useState([]);
  const set = (patch) => onChange({ ...value, ...patch });

  useEffect(() => { api.get('/geo/states').then((r) => setStates(r.data.states)).catch(() => {}); }, []);
  useEffect(() => {
    setDistricts([]);
    if (value.state) api.get('/geo/districts', { params: { state: value.state } }).then((r) => setDistricts(r.data.districts)).catch(() => {});
  }, [value.state]);
  useEffect(() => {
    setPins([]);
    if (value.state && value.district) api.get('/geo/pincodes', { params: { state: value.state, district: value.district } }).then((r) => setPins(r.data.pincodes)).catch(() => {});
  }, [value.state, value.district]);

  return (
    <>
      <label>Country<select disabled value="India"><option>India</option></select></label>
      <label>State / UT
        <select required={required} disabled={lockState} value={value.state || ''} onChange={(e) => set({ state: e.target.value, district: '', pincode: '' })}>
          <option value="">Select state</option>{states.map((s) => <option key={s}>{s}</option>)}
        </select></label>
      <label>District
        <select required={required} disabled={!value.state} value={value.district || ''} onChange={(e) => set({ district: e.target.value, pincode: '' })}>
          <option value="">Select district</option>{districts.map((d) => <option key={d}>{d}</option>)}
        </select></label>
      {pincode && (
        <label>Pincode
          <input required={required} list="rw-pins" inputMode="numeric" pattern="\d{6}" maxLength={6} placeholder="6-digit pincode" disabled={!value.district}
            value={value.pincode || ''} onChange={(e) => {
              const code = e.target.value.replace(/\D/g, '');
              const hit = pins.find((p) => p.code === code);
              set({ pincode: code, area: hit && !value.area ? hit.area : value.area });
            }} />
          <datalist id="rw-pins">{pins.map((p) => <option key={p.code} value={p.code}>{p.area}</option>)}</datalist>
        </label>
      )}
      {area && <label>Area / locality<input value={value.area || ''} onChange={(e) => set({ area: e.target.value })} /></label>}
    </>
  );
}
