// Lima districts with coordinates for nurse search

export interface District {
  name: string;
  lat: number;
  lng: number;
}

export const limaDistricts: District[] = [
  // Lima Centro
  { name: "Cercado de Lima", lat: -12.0464, lng: -77.0428 },
  { name: "Breña", lat: -12.0597, lng: -77.0519 },
  { name: "La Victoria", lat: -12.0728, lng: -77.0200 },
  { name: "Rimac", lat: -12.0256, lng: -77.0322 },

  // Lima Moderna
  { name: "San Isidro", lat: -12.0977, lng: -77.0365 },
  { name: "Miraflores", lat: -12.1186, lng: -77.0297 },
  { name: "San Borja", lat: -12.1067, lng: -77.0011 },
  { name: "Surco", lat: -12.1464, lng: -76.9913 },
  { name: "La Molina", lat: -12.0867, lng: -76.9353 },
  { name: "Barranco", lat: -12.1431, lng: -77.0225 },
  { name: "Jesus Maria", lat: -12.0711, lng: -77.0447 },
  { name: "Lince", lat: -12.0833, lng: -77.0333 },
  { name: "Magdalena del Mar", lat: -12.0894, lng: -77.0694 },
  { name: "Pueblo Libre", lat: -12.0747, lng: -77.0633 },
  { name: "San Miguel", lat: -12.0769, lng: -77.0928 },
  { name: "Surquillo", lat: -12.1131, lng: -77.0119 },

  // Lima Sur
  { name: "Chorrillos", lat: -12.1711, lng: -77.0147 },
  { name: "San Juan de Miraflores", lat: -12.1558, lng: -76.9722 },
  { name: "Villa Maria del Triunfo", lat: -12.1658, lng: -76.9419 },
  { name: "Villa El Salvador", lat: -12.2125, lng: -76.9419 },

  // Lima Este
  { name: "Ate", lat: -12.0256, lng: -76.9181 },
  { name: "Santa Anita", lat: -12.0431, lng: -76.9706 },
  { name: "El Agustino", lat: -12.0461, lng: -76.9989 },
  { name: "San Juan de Lurigancho", lat: -11.9833, lng: -77.0028 },
  { name: "San Luis", lat: -12.0761, lng: -77.0044 },

  // Lima Norte
  { name: "Los Olivos", lat: -11.9656, lng: -77.0706 },
  { name: "San Martin de Porres", lat: -11.9983, lng: -77.0839 },
  { name: "Independencia", lat: -11.9933, lng: -77.0469 },
  { name: "Comas", lat: -11.9456, lng: -77.0583 },
  { name: "Carabayllo", lat: -11.8500, lng: -77.0333 },
  { name: "Puente Piedra", lat: -11.8622, lng: -77.0742 },

  // Callao
  { name: "Callao", lat: -12.0611, lng: -77.1375 },
  { name: "Bellavista", lat: -12.0597, lng: -77.0683 },
  { name: "La Perla", lat: -12.0694, lng: -77.1056 },
  { name: "La Punta", lat: -12.0697, lng: -77.1617 },
];

// Service categories for search filter
export interface ServiceCategory {
  value: string;
  label: string;
}

export const serviceCategories: ServiceCategory[] = [
  { value: "", label: "Todos los servicios" },
  { value: "elderly_care", label: "Cuidado de adulto mayor" },
  { value: "injection", label: "Inyecciones" },
  { value: "wound_care", label: "Curaciones" },
  { value: "vital_signs", label: "Control de signos vitales" },
  { value: "post_surgery", label: "Cuidado post-operatorio" },
  { value: "medication", label: "Administracion de medicamentos" },
  { value: "nebulization", label: "Nebulizacion" },
  { value: "catheter", label: "Colocacion de sonda" },
  { value: "hospital_care", label: "Acompanamiento hospitalario" },
];
