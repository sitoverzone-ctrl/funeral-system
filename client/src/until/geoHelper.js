// src/utils/geoHelper.js

// รายชื่อ 77 จังหวัดทั่วประเทศไทยครบถ้วน
const ALL_PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", 
  "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", 
  "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", 
  "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", 
  "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", 
  "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", 
  "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", 
  "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
];

// 1. ดึงรายการจังหวัดทั้งหมด (รวม 77 จังหวัด และจังหวัดจากข้อมูลสมาชิกจริง)
export function getAvailableProvinces() {
  try {
    const members = JSON.parse(localStorage.getItem('funeral_members')) || [];
    const memberProvinces = members.map(m => m.province).filter(Boolean);
    const combined = Array.from(new Set([...ALL_PROVINCES, ...memberProvinces]));
    return combined.map(p => ({ value: p, label: p }));
  } catch (e) {
    return ALL_PROVINCES.map(p => ({ value: p, label: p }));
  }
}

// 2. ดึงรายการอำเภอตามจังหวัดที่เลือก (ซิงค์อัตโนมัติ + รองรับข้อมูลสมาชิก)
export function getAvailableDistricts(province) {
  if (!province) return [];
  try {
    const members = JSON.parse(localStorage.getItem('funeral_members')) || [];
    const filtered = members.filter(m => m.province === province);
    const districts = filtered.map(m => m.district || m.amphur || m.amphoe).filter(Boolean);

    let defaults = [];
    if (province === 'บึงกาฬ') {
      defaults = ['เซกา', 'บึงโขงหลง', 'พรเจริญ', 'ปากคาด', 'โซ่พิสัย', 'ศรีวิไล', 'เมืองบึงกาฬ'];
    } else if (province === 'นครราชสีมา') {
      defaults = ['เมืองนครราชสีมา', 'ปากช่อง', 'ครบุรี', 'สูงเนิน', 'โชคชัย', 'พิมาย', 'จักราช', 'หนองบุญมาก', 'ปักธงชัย'];
    } else if (province === 'ขอนแก่น') {
      defaults = ['เมืองขอนแก่น', 'ชุมแพ', 'น้ำพอง', 'บ้านไผ่', 'พล', 'กระนวน'];
    }

    const combined = Array.from(new Set([...defaults, ...districts]));
    return combined.map(d => ({ value: d, label: d }));
  } catch (e) {
    return [];
  }
}

// 3. ดึงรายการตำบลตามจังหวัดและอำเภอที่เลือก (ซิงค์อัตโนมัติ)
export function getAvailableSubdistricts(province, district) {
  if (!province || !district) return [];
  try {
    const members = JSON.parse(localStorage.getItem('funeral_members')) || [];
    const filtered = members.filter(m => {
      const matchProv = m.province === province;
      const matchDist = (m.district === district || m.amphur === district || m.amphoe === district);
      return matchProv && matchDist;
    });

    const subdistricts = filtered.map(m => m.subdistrict || m.tumbol).filter(Boolean);

    let defaults = [];
    if (province === 'บึงกาฬ' && district === 'เซกา') {
      defaults = ['ซาง', 'เซกา', 'ท่ากกแดง', 'ป่า건', 'โศกก่าม', 'หนองจันทร์'];
    }

    const combined = Array.from(new Set([...defaults, ...subdistricts]));
    return combined.map(s => ({ value: s, label: s }));
  } catch (e) {
    return [];
  }
}

// 4. ดึงรายการหมู่บ้านตามพื้นที่ (จากหน้าข้อมูลหมู่บ้านที่บันทึกไว้ หรือข้อมูลสมาชิก)
export function getAvailableVillages(province, district, subdistrict) {
  if (!province || !district || !subdistrict) return [];
  try {
    const storageKey = `funeral_villages_${province}_${district}_${subdistrict}`;
    const savedVillages = JSON.parse(localStorage.getItem(storageKey));
    
    if (savedVillages && Array.isArray(savedVillages) && savedVillages.length > 0) {
      return savedVillages.map(v => ({ value: v.moo, label: `หมู่ ${v.moo} (${v.name})` }));
    }

    const members = JSON.parse(localStorage.getItem('funeral_members')) || [];
    const filtered = members.filter(m => {
      const matchProv = m.province === province;
      const matchDist = (m.district === district || m.amphur === district || m.amphoe === district);
      const matchSub = (m.subdistrict === subdistrict || m.tumbol === subdistrict);
      return matchProv && matchDist && matchSub;
    });

    const memberVillages = filtered.map(m => m.village || m.moo).filter(Boolean);
    if (memberVillages.length > 0) {
      return Array.from(new Set(memberVillages)).map(v => ({ value: v, label: `หมู่ ${v}` }));
    }

    if (province === 'บึงกาฬ' && district === 'เซกา' && subdistrict === 'ซาง') {
      return [
        { value: '1', label: 'หมู่ 1 (บ้านซาง)' },
        { value: '2', label: 'หมู่ 2 (บ้านท่าสำราญ)' },
        { value: '3', label: 'หมู่ 3 (บ้านซอมคอก)' },
        { value: '4', label: 'หมู่ 4 (บ้านโคกบริการ)' },
        { value: '6', label: 'หมู่ 6 (บ้านแตงสาร)' },
        { value: '7', label: 'หมู่ 7 (บ้านสันกำแพง)' },
        { value: '8', label: 'หมู่ 8 (บ้านท่าเรือ)' },
        { value: '9', label: 'หมู่ 9 (บ้านซางใต้)' },
        { value: '10', label: 'หมู่ 10 (บ้านโนนสง่า)' },
      ];
    }

    return [];
  } catch (e) {
    return [];
  }
}