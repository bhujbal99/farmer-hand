/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sprout, 
  Upload, 
  ClipboardCheck, 
  CloudSun, 
  History as HistoryIcon,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileText,
  DollarSign,
  Droplets,
  Zap,
  Leaf,
  Calculator,
  X,
  Wind,
  Thermometer,
  CloudLightning,
  Sun,
  CloudRain,
  MapPin,
  Search,
  ChevronDown
} from "lucide-react";
import { analyzeSoil, getCropLifecycle, calculateFertilizer, findSoilLabs } from "./lib/gemini";
import { SoilData, AnalysisResult, Crop, WeatherData, SoilLab } from "./types";
import { fetchWeatherData } from "./services/weatherService";

export default function App() {
  const [lang, setLang] = useState<"en" | "mr">("en");
  const [activeTab, setActiveTab] = useState<"analyze" | "history" | "guide" | "labs">("analyze");
  const [loading, setLoading] = useState(false);
  const [soilData, setSoilData] = useState<SoilData>({
    ph: 6.5,
    nitrogen: "Medium",
    phosphorus: "Medium",
    potassium: "Medium",
    soilType: "Loamy",
    region: "Maharashtra",
    district: "Nashik"
  });
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisLang, setAnalysisLang] = useState<string>("");
  const [lifecycle, setLifecycle] = useState<any | null>(null);
  const [lifecycleLang, setLifecycleLang] = useState<string>("");
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showCalculator, setShowCalculator] = useState(false);
  const [calcAcreage, setCalcAcreage] = useState<number>(1);
  const [calcCrop, setCalcCrop] = useState<string>("");
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calcResultLang, setCalcResultLang] = useState<string>("");
  const [calcLoading, setCalcLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [labState, setLabState] = useState("");
  const [labDistrict, setLabDistrict] = useState("");
  const [labPincode, setLabPincode] = useState("");
  const [labs, setLabs] = useState<SoilLab[]>([]);
  const [labsLang, setLabsLang] = useState<string>("");
  const [labLoading, setLabLoading] = useState(false);

  // States and Districts Data (Simplified for major agricultural states)
  const stateTranslations: Record<string, { en: string, mr: string }> = {
    "Maharashtra": { en: "Maharashtra", mr: "महाराष्ट्र" },
    "Gujarat": { en: "Gujarat", mr: "गुजरात" },
    "Karnataka": { en: "Karnataka", mr: "कर्नाटक" },
    "Punjab": { en: "Punjab", mr: "पंजाब" },
    "Uttar Pradesh": { en: "Uttar Pradesh", mr: "उत्तर प्रदेश" },
    "Madhya Pradesh": { en: "Madhya Pradesh", mr: "मध्य प्रदेश" },
    "Rajasthan": { en: "Rajasthan", mr: "राजस्थान" },
    "Haryana": { en: "Haryana", mr: "हरियाणा" },
    "Tamil Nadu": { en: "Tamil Nadu", mr: "तमिळनाडू" },
    "Telangana": { en: "Telangana", mr: "तेलंगणा" },
    "Andhra Pradesh": { en: "Andhra Pradesh", mr: "आंध्र प्रदेश" }
  };

  const districtTranslations: Record<string, string> = {
    // Maharashtra
    "Ahmednagar": "अहमदनगर",
    "Akola": "अकोला",
    "Amravati": "अमरावती",
    "Beed": "बीड",
    "Bhandara": "भंडारा",
    "Buldhana": "बुलढाणा",
    "Chandrapur": "चंद्रपूर",
    "Chhatrapati Sambhajinagar (Aurangabad)": "छत्रपती संभाजीनगर (औरंगाबाद)",
    "Dharashiv (Osmanabad)": "धाराशिव (उस्मानाबाद)",
    "Dhule": "धुळे",
    "Gadchiroli": "गडचिरोली",
    "Gondia": "गोंदिया",
    "Hingoli": "हिंगोली",
    "Jalgaon": "जळगाव",
    "Jalna": "जालना",
    "Kolhapur": "कोल्हापूर",
    "Latur": "लातूर",
    "Mumbai City": "मुंबई शहर",
    "Mumbai Suburban": "मुंबई उपनगर",
    "Nagpur": "नागपूर",
    "Nanded": "नांदेड",
    "Nandurbar": "नंदुरबार",
    "Nashik": "नाशिक",
    "Palghar": "पालघर",
    "Parbhani": "परभणी",
    "Pune": "पुणे",
    "Raigad": "रायगड",
    "Ratnagiri": "रत्नागिरी",
    "Sangli": "सांगली",
    "Satara": "सातारा",
    "Sindhudurg": "सिंधुदुर्ग",
    "Solapur": "सोलापूर",
    "Thane": "ठाणे",
    "Wardha": "वर्धा",
    "Washim": "वाशीम",
    "Yavatmal": "यवतमाळ",
    // Gujarat
    "Ahmedabad": "अहमदाबाद",
    "Amreli": "अमरेली",
    "Anand": "आणंद",
    "Gandhinagar": "गांधीनगर",
    "Jamnagar": "जामनगर",
    "Junagadh": "जुनागढ",
    "Kheda": "खेडा",
    "Rajkot": "राजकोट",
    "Surat": "सुरत",
    "Vadodara": "वडोदरा",
    // Karnataka
    "Bagalkot": "बागलकोट",
    "Belagavi": "बेळगाव",
    "Bengaluru Urban": "बंगळुरू शहर",
    "Bidar": "बीदर",
    "Dharwad": "धारवाड",
    "Kalaburagi": "कलबुर्गी",
    "Mysuru": "मैसूर",
    "Vijayapura": "विजापूर",
    // Punjab
    "Amritsar": "अमृतसर",
    "Bathinda": "बठिंडा",
    "Jalandhar": "जालंधर",
    "Ludhiana": "लुधियाना",
    "Patiala": "पटियाला",
    // Uttar Pradesh
    "Agra": "आग्रा",
    "Aligarh": "अलीगड",
    "Prayagraj": "प्रयागराज",
    "Ayodhya": "अयोध्या",
    "Bareilly": "बरेली",
    "Kanpur Nagar": "कानपूर नगर",
    "Lucknow": "लखनऊ",
    "Mathura": "मथुरा",
    "Meerut": "मेरठ",
    "Varanasi": "वाराणसी",
    // Madhya Pradesh
    "Bhopal": "भोपाळ",
    "Gwalior": "ग्वाल्हेर",
    "Indore": "इंदौर",
    "Jabalpur": "जबलपूर",
    "Ujjain": "उज्जैन",
    // Rajasthan
    "Ajmer": "अजमेर",
    "Bikaner": "बिकानेर",
    "Jaipur": "जयपूर",
    "Jodhpur": "जोधपूर",
    "Kota": "कोटा",
    "Udaipur": "उदयपूर",
    // Haryana
    "Ambala": "अंबाला",
    "Gurugram": "गुरुग्राम",
    "Hisar": "हिसार",
    "Panipat": "पानिपत",
    "Rohtak": "रोहतक",
    // Tamil Nadu
    "Chennai": "चेन्नई",
    "Coimbatore": "कोईमतूर",
    "Madurai": "मदुराई",
    "Salem": "सेलम",
    // Telangana
    "Hyderabad": "हैदराबाद",
    "Warangal": "वरंगल",
    // Andhra Pradesh
    "Anantapur": "अनंतपूर",
    "Guntur": "गुंटूर",
    "Nellore": "नेल्लोर",
    "Visakhapatnam": "विशाखापट्टनम"
  };

  const statesData: Record<string, string[]> = {
    "Maharashtra": [
      "Ahmednagar", "Akola", "Amravati", "Beed", "Bhandara", "Buldhana", 
      "Chandrapur", "Chhatrapati Sambhajinagar (Aurangabad)", "Dharashiv (Osmanabad)", "Dhule", 
      "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", 
      "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", 
      "Nandurbar", "Nashik", "Palghar", "Parbhani", "Pune", "Raigad", 
      "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", 
      "Wardha", "Washim", "Yavatmal"
    ],
    "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udepur", "Dahod", "Dang", "Devbhumi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
    "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"],
    "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sangrur", "SAS Nagar", "SBS Nagar", "Tarn Taran"],
    "Uttar Pradesh": ["Agra", "Aligarh", "Prayagraj", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
    "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
    "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
    "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
    "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
    "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Kumuram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal–Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Hanamkonda", "Yadadri Bhuvanagiri"],
    "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Kadapa", "Krishna", "Kurnool", "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari"]
  };

  const indianCrops = [
    { id: "Rice (Paddy)", en: "Rice (Paddy)", mr: "तांदूळ (भात)" },
    { id: "Wheat", en: "Wheat", mr: "गहू" },
    { id: "Maize", en: "Maize", mr: "मका" },
    { id: "Cotton", en: "Cotton", mr: "कापूस" },
    { id: "Sugarcane", en: "Sugarcane", mr: "ऊस" },
    { id: "Soybean", en: "Soybean", mr: "सोयाबीन" },
    { id: "Groundnut", en: "Groundnut", mr: "भुईमूग" },
    { id: "Mustard", en: "Mustard", mr: "मोहरी" },
    { id: "Chickpea (Gram)", en: "Chickpea (Gram)", mr: "हरभरा" },
    { id: "Pigeon Pea (Tur)", en: "Pigeon Pea (Tur)", mr: "तुरी" },
    { id: "Black Gram (Urad)", en: "Black Gram (Urad)", mr: "उडीद" },
    { id: "Green Gram (Moong)", en: "Green Gram (Moong)", mr: "मूग" },
    { id: "Jowar (Sorghum)", en: "Jowar (Sorghum)", mr: "ज्वारी" },
    { id: "Bajra (Pearl Millet)", en: "Bajra (Pearl Millet)", mr: "बाजरी" },
    { id: "Onion", en: "Onion", mr: "कांदा" },
    { id: "Potato", en: "Potato", mr: "बटाटा" },
    { id: "Tomato", en: "Tomato", mr: "टोमॅटो" },
    { id: "Chilli", en: "Chilli", mr: "मिरची" },
    { id: "Turmeric", en: "Turmeric", mr: "हळद" },
    { id: "Ginger", en: "Ginger", mr: "आले" },
    { id: "Mango", en: "Mango", mr: "आंबा" },
    { id: "Banana", en: "Banana", mr: "केळी" },
    { id: "Grapes", en: "Grapes", mr: "द्राक्षे" },
    { id: "Pomegranate", en: "Pomegranate", mr: "डाळिंब" },
    { id: "Citrus (Lemon/Orange)", en: "Citrus (Lemon/Orange)", mr: "लिंबूवर्गीय फळे" },
    { id: "Cauliflower", en: "Cauliflower", mr: "फ्लॉवर" },
    { id: "Cabbage", en: "Cabbage", mr: "कोबी" },
    { id: "Okra (Bhindi)", en: "Okra (Bhindi)", mr: "भेंडी" },
    { id: "Brinjal", en: "Brinjal", mr: "वांगी" },
    { id: "Garlic", en: "Garlic", mr: "लसूण" }
  ].sort((a, b) => a.en.localeCompare(b.en));

  const soilTypesList = [
    { id: "Black", en: "Black Soil", mr: "काळी माती" },
    { id: "Red", en: "Red Soil", mr: "लाल माती" },
    { id: "Alluvial", en: "Alluvial Soil", mr: "गाळाची माती" },
    { id: "Laterite", en: "Laterite Soil", mr: "जांभी माती" },
    { id: "Sandy", en: "Sandy Soil", mr: "रेताड माती" },
    { id: "Clayey", en: "Clayey Soil", mr: "चिक्कण माती" },
    { id: "Loamy", en: "Loamy Soil", mr: "लोमी माती" }
  ];

  const t = translations[lang];

  useEffect(() => {
    fetchHistory();
    getWeather();
  }, []);

  useEffect(() => {
    if (analysis && analysisLang !== lang) {
      handleManualAnalyze();
    }
    if (lifecycle && lifecycleLang !== lang) {
      fetchLifecycle(lifecycle.cropName); // We'll need to store cropName in lifecycle
    }
    if (calcResult && calcResultLang !== lang) {
      handleCalculateFertilizer();
    }
    if (labs.length > 0 && labsLang !== lang) {
      handleFindLabs();
    }
  }, [lang]);

  const getWeather = () => {
    if ("geolocation" in navigator) {
      setWeatherLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const data = await fetchWeatherData(position.coords.latitude, position.coords.longitude);
            setWeather(data);
          } catch (err) {
            console.error("Weather fetch failed", err);
          } finally {
            setWeatherLoading(false);
          }
        },
        (error) => {
          console.error("Geolocation failed", error);
          // Fallback to a default location (e.g., Nashik, Maharashtra)
          fetchDefaultWeather();
        }
      );
    } else {
      fetchDefaultWeather();
    }
  };

  const fetchDefaultWeather = async () => {
    try {
      setWeatherLoading(true);
      const data = await fetchWeatherData(19.9975, 73.7898); // Nashik
      setWeather(data);
    } catch (err) {
      console.error(err);
    } finally {
      setWeatherLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error("Failed to fetch history");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const result = await analyzeSoil({}, base64, lang);
          setAnalysis(result);
          setAnalysisLang(lang);
          setLoading(false);
        } catch (err: any) {
          setError(`AI failed: ${err.message || "Unknown error"}`);
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("AI failed to process the image. Please try manual entry.");
      setLoading(false);
    }
  };

  const handleManualAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeSoil(soilData, undefined, lang);
      setAnalysis(result);
      setAnalysisLang(lang);
      
      // Save to DB
      await fetch("/api/save-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soilData, analysis: result, region: soilData.region })
      });
      fetchHistory();
    } catch (err: any) {
      setError(`Analysis failed: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchLifecycle = async (cropName: string) => {
    setLoading(true);
    try {
      const result = await getCropLifecycle(cropName, lang);
      setLifecycle({ ...result, cropName });
      setLifecycleLang(lang);
      // Scroll to lifecycle section
      document.getElementById("lifecycle-section")?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      setError("Failed to get lifecycle data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateFertilizer = async () => {
    setCalcLoading(true);
    try {
      const result = await calculateFertilizer(calcCrop || analysis?.recommendations[0] || "", soilData, calcAcreage, lang);
      setCalcResult(result);
      setCalcResultLang(lang);
    } catch (err) {
      console.error(err);
    }
    setCalcLoading(false);
  };

  const handleFindLabs = async () => {
    if (!labState && !labDistrict && !labPincode) return;
    setLabLoading(true);
    setLabs([]);
    try {
      const areaQuery = `${labDistrict}${labDistrict ? ', ' : ''}${labState} ${labPincode}`.trim();
      const result = await findSoilLabs(areaQuery, lang);
      setLabs(result.labs);
      setLabsLang(lang);
    } catch (err) {
      console.error(err);
      setError("Failed to locate local labs.");
    } finally {
      setLabLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans texture-bg">
      {/* Sidebar/Nav */}
      <nav className="fixed top-0 left-0 w-full bg-paper/90 backdrop-blur-md border-b border-line z-50 px-8 py-6 flex justify-between items-end h-[120px]">
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center -mb-2 shadow-xl border-2 border-accent/20 overflow-hidden group">
            <img 
              src="/logo.png" 
              alt="Farmer Hand Logo" 
              className="w-12 h-12 object-contain group-hover:scale-110 transition-transform"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = "https://api.iconify.design/lucide:sprout.svg?color=%2315803d";
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="meta-label text-accent font-black tracking-widest">{t.systemName}</span>
            <h1 className="font-serif text-3xl lg:text-4xl font-black leading-tight tracking-tight text-ink">
              FARMER <span className="text-leaf">HAND</span>
            </h1>
            <span className="text-[8px] font-bold text-earth/60 uppercase tracking-tighter -mt-1">
              Soil Health • Better Crops • Better Future
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 translate-y-3 lg:translate-y-0">
          <div className="flex bg-line/20 p-1 rounded-md border border-line">
            <button 
              onClick={() => setLang("en")}
              className={`text-[9px] font-black uppercase px-2 py-1 rounded transition-colors ${lang === "en" ? "bg-accent text-white" : "text-ink/40 hover:text-ink"}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLang("mr")}
              className={`text-[9px] font-black uppercase px-2 py-1 rounded transition-colors ${lang === "mr" ? "bg-accent text-white" : "text-ink/40 hover:text-ink"}`}
            >
              मराठी
            </button>
          </div>
          <div className="flex gap-4 mb-4">
            <button 
              onClick={() => setActiveTab("analyze")}
              className={`meta-label px-5 py-2 border-2 transition-all ${activeTab === "analyze" ? "bg-accent text-white border-accent shadow-lg shadow-accent/20" : "border-line hover:border-ink"}`}
            >
              {t.tabAnalysis}
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`meta-label px-5 py-2 border-2 transition-all ${activeTab === "history" ? "bg-accent text-white border-accent shadow-lg shadow-accent/20" : "border-line hover:border-ink"}`}
            >
              {t.tabRecords}
            </button>
            <button 
              onClick={() => setActiveTab("guide")}
              className={`meta-label px-5 py-2 border-2 transition-all ${activeTab === "guide" ? "bg-accent text-white border-accent shadow-lg shadow-accent/20" : "border-line hover:border-ink"}`}
            >
              {t.tabGuide}
            </button>
            <button 
              onClick={() => setActiveTab("labs")}
              className={`meta-label px-5 py-2 border-2 transition-all ${activeTab === "labs" ? "bg-accent text-white border-accent shadow-lg shadow-accent/20" : "border-line hover:border-ink"}`}
            >
              {t.tabLabs}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-[120px]">
        <div className="relative h-[300px] lg:h-[400px] overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=2070&auto=format&fit=crop"
            className="w-full h-full object-cover"
            alt="Farmer Hands with Soil"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/40 to-transparent" />
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-7xl px-8">
            <motion.div 
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-4 bg-paper/90 backdrop-blur-xl p-10 lg:p-12 rounded-[3.5rem] border-2 border-accent/10 inline-block max-w-2xl shadow-2xl"
            >
              <h2 className="font-serif text-5xl lg:text-7xl font-black text-ink leading-tight">
                Empowering the <br /> <span className="text-leaf italic underline decoration-harvest/40 underline-offset-8">Farmers that Feed.</span>
              </h2>
              <p className="text-lg lg:text-xl font-bold text-earth leading-relaxed">
                {t.heroSubtitle}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto pt-12 pb-24 px-8">
        <AnimatePresence mode="wait">
          {activeTab === "analyze" ? (
            <motion.div 
              key="analyze"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid lg:grid-cols-[300px_1fr] gap-12"
            >
              {/* Left: Input Sidebar */}
              <div className="space-y-12">
                <section>
                  <span className="meta-label mb-6 block underline decoration-harvest/50 underline-offset-8 font-black">{t.inputMethods}</span>
                  
                  <div className="space-y-8">
                    {/* Image Upload */}
                    <div className="group">
                      <label className="border-2 border-dashed border-line rounded-[2rem] p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-accent hover:shadow-xl transition-all duration-500 overflow-hidden relative">
                        <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6 text-accent" />
                        </div>
                        <p className="text-[12px] font-black uppercase tracking-[0.2em]">{t.uploadReport}</p>
                        <p className="text-[10px] text-earth/60 mt-2 italic font-medium">{t.scanReport}</p>
                      </label>
                    </div>

                    {/* Form */}
                    <div className="space-y-8 bg-white/40 p-8 rounded-[2rem] border border-line shadow-sm">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-8">
                        <div className="col-span-2 border-b border-line pb-2 flex items-center gap-3">
                          <div className="w-2 h-2 bg-harvest rounded-full" />
                          <span className="meta-label !text-earth">{t.soilMetrics}</span>
                        </div>
                        
                        <div>
                          <label className="text-[10px] font-black uppercase text-earth/70 block mb-2">{t.phLevel}</label>
                          <input 
                            type="number" step="0.1" value={isNaN(soilData.ph) ? "" : soilData.ph}
                            onChange={e => {
                              const val = e.target.value;
                              setSoilData({...soilData, ph: val === "" ? NaN : parseFloat(val)});
                            }}
                            className="w-full bg-transparent border-b-2 border-line/40 py-2 text-2xl font-serif font-black outline-none focus:border-accent transition-all pl-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-earth/70 block mb-2">{t.nitrogen}</label>
                          <select 
                            value={soilData.nitrogen}
                            onChange={e => setSoilData({...soilData, nitrogen: e.target.value})}
                            className="w-full bg-transparent border-b-2 border-line/40 py-2 text-sm font-black outline-none focus:border-accent appearance-none cursor-pointer tracking-widest pl-1"
                          >
                            <option value="Low">{t.low}</option>
                            <option value="Medium">{t.medium}</option>
                            <option value="High">{t.high}</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-earth/70 block mb-2">{t.phosphorus}</label>
                          <select 
                            value={soilData.phosphorus}
                            onChange={e => setSoilData({...soilData, phosphorus: e.target.value})}
                            className="w-full bg-transparent border-b-2 border-line/40 py-2 text-sm font-black outline-none focus:border-accent appearance-none cursor-pointer tracking-widest pl-1"
                          >
                            <option value="Low">{t.low}</option>
                            <option value="Medium">{t.medium}</option>
                            <option value="High">{t.high}</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-earth/70 block mb-2">{t.potassium}</label>
                          <select 
                            value={soilData.potassium}
                            onChange={e => setSoilData({...soilData, potassium: e.target.value})}
                            className="w-full bg-transparent border-b-2 border-line/40 py-2 text-sm font-black outline-none focus:border-accent appearance-none cursor-pointer tracking-widest pl-1"
                          >
                            <option value="Low">{t.low}</option>
                            <option value="Medium">{t.medium}</option>
                            <option value="High">{t.high}</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-black uppercase text-earth/70 block mb-2">{t.soilTypology}</label>
                          <select 
                            value={soilData.soilType}
                            onChange={e => setSoilData({...soilData, soilType: e.target.value})}
                            className="w-full bg-transparent border-b-2 border-line/40 py-2 text-sm font-black outline-none focus:border-accent appearance-none cursor-pointer tracking-widest pl-1"
                          >
                            {soilTypesList.map(st => (
                              <option key={st.id} value={st.en}>{lang === "mr" ? st.mr : st.en}</option>
                            ))}
                            <option value="Other">{lang === "mr" ? "इतर" : "Other"}</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-black uppercase text-earth/70 block mb-2">{t.labelState}</label>
                          <div className="relative">
                            <select 
                              value={soilData.region}
                              onChange={e => {
                                const newRegion = e.target.value;
                                setSoilData({
                                  ...soilData, 
                                  region: newRegion,
                                  district: statesData[newRegion]?.[0] || ""
                                });
                              }}
                              className="w-full bg-transparent border-b-2 border-line/40 py-2 text-base font-black outline-none focus:border-accent appearance-none cursor-pointer tracking-wide pl-1"
                            >
                              <option value="">{t.selectState}</option>
                              {Object.keys(statesData).sort().map(state => (
                                <option key={state} value={state}>
                                  {lang === "mr" && stateTranslations[state] ? stateTranslations[state].mr : state}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-30" />
                          </div>
                        </div>

                        <div className="col-span-2">
                          <label className="text-[10px] font-black uppercase text-earth/70 block mb-2">{t.labelDistrict}</label>
                          <div className="relative">
                            <select 
                              value={soilData.district}
                              disabled={!soilData.region}
                              onChange={e => setSoilData({...soilData, district: e.target.value})}
                              className="w-full bg-transparent border-b-2 border-line/40 py-2 text-base font-black outline-none focus:border-accent appearance-none cursor-pointer tracking-wide pl-1 disabled:opacity-30"
                            >
                              <option value="">{t.selectDistrict}</option>
                              {soilData.region && statesData[soilData.region]?.sort().map(dist => (
                                <option key={dist} value={dist}>
                                  {lang === "mr" && districtTranslations[dist] ? districtTranslations[dist] : dist}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-30" />
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={handleManualAnalyze}
                        disabled={loading}
                        className="w-full bg-accent text-white py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.25em] hover:bg-leaf hover:shadow-2xl hover:shadow-leaf/20 transition-all active:scale-95 disabled:bg-line disabled:text-gray-400 flex items-center justify-center gap-3 overflow-hidden group relative"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        {loading ? <Loader2 className="animate-spin w-5 h-5 relative z-10" /> : <><ClipboardCheck className="w-5 h-5 relative z-10" /> <span className="relative z-10">{t.generateReport}</span></>}
                      </button>
                    </div>
                  </div>
                </section>

                {error && (
                  <div className="border border-red-200 p-4 text-[10px] uppercase font-bold text-red-600 tracking-tighter italic">
                    Error: {error}
                  </div>
                )}
              </div>

              {/* Right: Analysis Report Content */}
              <div className="space-y-16">
                {analysis ? (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="space-y-16"
                  >
                    {/* Execution Summary */}
                    <div className="space-y-10 glass-card p-12 rounded-[3rem] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-harvest/10 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                      <div className="flex justify-between items-end border-b-2 border-line/40 pb-6 relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="w-3 h-3 bg-leaf rounded-full animate-pulse" />
                          <span className="meta-label !text-leaf font-black">{t.surveyDecomp}</span>
                        </div>
                        <span className="text-[10px] uppercase font-black italic opacity-20 tracking-widest">{t.surveyId}882</span>
                      </div>
                      
                      <div className="grid lg:grid-cols-[1fr_260px] gap-12 relative z-10">
                        <div className="space-y-8">
                          <div className="space-y-4">
                            <span className="text-leaf font-black uppercase text-[10px] tracking-[0.2em]">{t.diagnosticResult}</span>
                            <h3 className="font-serif text-5xl lg:text-7xl font-black text-ink leading-tight pb-2">
                              {analysis.soilCondition} <span className="text-xl opacity-40 font-sans not-italic uppercase tracking-widest font-black leading-none">{t.inCity}</span> {soilData.district ? `${lang === "mr" && districtTranslations[soilData.district] ? districtTranslations[soilData.district] : soilData.district}, ` : ''}{lang === "mr" && stateTranslations[soilData.region] ? stateTranslations[soilData.region].mr : soilData.region}
                            </h3>
                          </div>
                          <p className="text-2xl lg:text-3xl font-serif leading-relaxed opacity-90 font-medium italic border-l-4 border-harvest pl-8 py-2">
                            "{analysis.explanation}"
                          </p>
                        </div>
                        <div className="bg-ink text-white p-10 self-start rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] transform hover:-translate-y-2 transition-transform w-full lg:w-[260px]">
                          <div className="flex justify-between items-center mb-6">
                            <span className="text-[10px] uppercase tracking-[0.3em] font-black opacity-60">{t.climateStatus}</span>
                            {weatherLoading && <Loader2 className="w-3 h-3 animate-spin opacity-40" />}
                          </div>
                          
                          {weather ? (
                            <div className="space-y-6">
                              <div className="flex items-center gap-5">
                                <span className="text-6xl font-serif font-black">{Math.round(weather.current.temp)}°<span className="text-2xl opacity-60 ml-1">C</span></span>
                                <CloudSun className="w-10 h-10 text-harvest animate-bounce" />
                              </div>
                              <p className="text-sm font-bold text-white/80">{weather.current.description}</p>
                              
                              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                <div className="flex items-center gap-2">
                                  <Droplets className="w-4 h-4 text-leaf" />
                                  <span className="text-[10px] font-black">{weather.current.humidity}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Wind className="w-4 h-4 text-harvest" />
                                  <span className="text-[10px] font-black">{weather.current.windSpeed} km/h</span>
                                </div>
                              </div>

                              <div className="pt-4 space-y-4">
                                <span className="text-[9px] font-black uppercase tracking-widest block opacity-40">{t.pastFiveDays}</span>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                  {weather.historical.map((h, i) => (
                                    <div key={i} className="flex flex-col items-center bg-white/5 p-2 rounded-lg min-w-[50px]">
                                      <span className="text-[8px] opacity-40 font-black">{h.date.split(',')[0]}</span>
                                      <span className="text-xs font-black">{Math.round(h.temp)}°</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="pt-4 space-y-4">
                                <span className="text-[9px] font-black uppercase tracking-widest block opacity-40">{t.forecastFiveDays}</span>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                  {weather.forecast.map((f, i) => (
                                    <div key={i} className="flex flex-col items-center bg-accent/20 p-2 rounded-lg min-w-[50px] border border-accent/20">
                                      <span className="text-[8px] text-accent font-black">{f.date.split(',')[0]}</span>
                                      <span className="text-xs font-black">{Math.round(f.temp)}°</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="py-12 flex flex-col items-center justify-center opacity-40">
                              <Loader2 className="w-8 h-8 animate-spin mb-4" />
                              <p className="text-[10px] uppercase font-black tracking-widest text-center">{weatherLoading ? t.satelliteFetching : t.satelliteOffline}</p>
                            </div>
                          )}

                          <div className="mt-8 pt-6 border-t border-white/10">
                            <div className="text-[11px] uppercase leading-tight font-black text-leaf tracking-widest flex items-center gap-2">
                              <div className="w-2 h-2 bg-leaf rounded-full shrink-0" />
                              {weather ? t.satelliteLinkActive : t.waitingProtocol}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* pH Correction Section */}
                    {analysis.phCorrection?.required && (
                      <div className="bg-amber-50 border-2 border-amber-200 p-12 rounded-[3.5rem] space-y-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full -mr-16 -mt-16" />
                        <div className="flex items-center gap-6 relative z-10">
                          <div className="p-4 bg-amber-500/10 rounded-2xl">
                            <Zap className="w-8 h-8 text-amber-600" />
                          </div>
                          <h3 className="font-serif text-5xl font-black italic text-amber-900">{t.phCorrectionTitle}</h3>
                        </div>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 relative z-10">
                          <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase text-amber-700/50 tracking-widest">{t.phTreatment}</span>
                            <p className="text-2xl font-black text-amber-900">{analysis.phCorrection.treatment}</p>
                          </div>
                          <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase text-amber-700/50 tracking-widest">{t.phQuantity}</span>
                            <p className="text-2xl font-black text-amber-900">{analysis.phCorrection.quantityPerAcre}</p>
                          </div>
                          <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase text-amber-700/50 tracking-widest">{t.phCost}</span>
                            <p className="text-2xl font-black text-amber-900">{analysis.phCorrection.estimatedCostPerAcre}</p>
                          </div>
                          <div className="space-y-3 lg:col-span-1">
                             <span className="text-[10px] font-black uppercase text-amber-700/50 tracking-widest">{t.phInstructions}</span>
                             <p className="text-sm font-serif italic text-amber-800 leading-relaxed">{analysis.phCorrection.instructions}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recommendations Grid */}
                    <div className="space-y-10">
                      <div className="flex items-center justify-between border-b-2 border-line pb-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-leaf/10 rounded-xl">
                            <Sprout className="w-6 h-6 text-leaf" />
                          </div>
                          <span className="meta-label !text-ink font-black text-xs">{t.botanicalRecs}</span>
                        </div>
                        <span className="text-[10px] font-bold opacity-30 italic">Generated based on soil chemistry</span>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {analysis.recommendations.map((crop, i) => (
                          <div key={i} className="bg-white border-2 border-line/50 p-10 hover:border-accent hover:shadow-2xl hover:shadow-accent/10 group transition-all flex flex-col h-full rounded-[2.5rem] relative overflow-hidden">
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                            <span className="text-[10px] font-black text-harvest mb-4 uppercase tracking-[0.25em] relative z-10">{t.recommendedBioAsset}</span>
                            <h3 className="font-serif text-3xl lg:text-4xl font-black mb-6 relative z-10 leading-tight break-words pb-2">{crop}</h3>
                            <button 
                              onClick={() => fetchLifecycle(crop)}
                              className="mt-auto text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 group-hover:text-accent transition-colors py-5 border-t border-dashed border-line pt-6 relative z-10"
                            >
                              {t.exploreLifecycle} <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fertilizer Strategy */}
                    <div className="grid md:grid-cols-2 gap-12 bg-white/80 backdrop-blur-md p-14 rounded-[3.5rem] border-2 border-line shadow-inner relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8">
                        <button 
                          onClick={() => {
                            setCalcCrop(analysis.recommendations[0]);
                            setShowCalculator(true);
                          }}
                          className="bg-accent text-white p-4 rounded-2xl shadow-lg hover:scale-110 transition-transform flex items-center gap-3"
                        >
                          <Calculator className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{t.openCalc}</span>
                        </button>
                      </div>
                      <div className="space-y-10">
                        <div className="p-4 bg-harvest/10 w-fit rounded-2xl">
                          <Zap className="w-8 h-8 text-harvest" />
                        </div>
                        <h4 className="font-serif text-5xl font-black">
                          {t.inputStrategy}
                        </h4>
                        <div className="space-y-6">
                          <span className="meta-label !text-earth opacity-60 font-black">{t.soilAnalysisContext}</span>
                          <ul className="space-y-5">
                            {analysis.fertilizers.chemical.map((f, i) => (
                              <li key={i} className="flex justify-between items-center group">
                                <span className="text-lg font-bold group-hover:text-accent transition-colors">{f}</span>
                                <div className="h-px bg-line flex-1 mx-4 opacity-20" />
                                <span className="text-leaf font-black uppercase text-[10px] tracking-widest border border-leaf/20 px-3 py-1 rounded-full">{t.applyNow}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-10 border-l-2 border-line/30 pl-16">
                        <div className="p-4 bg-leaf/10 w-fit rounded-2xl">
                          <Leaf className="w-8 h-8 text-leaf" />
                        </div>
                        <h4 className="font-serif text-5xl font-black text-leaf">
                          {t.organicPath}
                        </h4>
                        <div className="space-y-6">
                          <span className="meta-label !text-leaf/60 font-black">{t.naturalEnrichment}</span>
                          <ul className="space-y-5">
                            {analysis.fertilizers.natural.map((f, i) => (
                              <li key={i} className="flex justify-between items-center group">
                                <span className="text-lg font-bold text-leaf group-hover:translate-x-1 transition-transform">{f}</span>
                                <div className="h-px bg-leaf/10 flex-1 mx-4" />
                                <span className="text-earth font-black uppercase text-[10px] tracking-widest">{t.naturalPath}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Risk Radar */}
                    <div className="bg-red-500 text-white p-14 rounded-[3.5rem] flex flex-col md:flex-row gap-12 relative overflow-hidden shadow-2xl shadow-red-200">
                      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_-20%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
                      <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center shrink-0 shadow-inner backdrop-blur-sm self-start">
                        <AlertCircle className="w-12 h-12 text-white" />
                      </div>
                      <div className="space-y-6 relative z-10">
                        <span className="meta-label !text-white/60 font-black text-xs tracking-[0.4em]">{t.criticalObs}</span>
                        <div className="grid md:grid-cols-2 gap-x-16 gap-y-6">
                          {analysis.risks.map((risk, i) => (
                            <p key={i} className="text-xl font-bold leading-snug border-l-4 border-white/20 pl-8 py-1"> {risk}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-[600px] flex flex-col items-center justify-center border-4 border-dashed border-line rounded-[4rem] text-center p-12 bg-white/40 group hover:bg-white transition-all duration-700">
                     <div className="w-32 h-32 bg-line/10 rounded-full flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-700">
                       <FileText className="w-16 h-16 text-ink/10 group-hover:text-accent/20 transition-colors" />
                     </div>
                     <h3 className="font-serif text-5xl opacity-40 italic font-black">{t.waitingData}</h3>
                     <div className="text-[12px] uppercase font-black tracking-[0.4em] opacity-30 mt-10 flex items-center gap-4">
                       <div className="w-12 h-px bg-line" />
                       {t.systemIdling}
                       <div className="w-12 h-px bg-line" />
                     </div>
                  </div>
                )}
              </div>

              {/* Lifecycle Overlay/Section */}
              <AnimatePresence>
                {lifecycle && (
                  <motion.div 
                    id="lifecycle-section"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 grid lg:grid-cols-[1fr_400px] gap-16 mt-32 pt-24 border-t-4 border-ink relative"
                  >
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-5 pointer-events-none">
                      <Sprout className="w-64 h-64 text-ink" />
                    </div>
                    <div className="space-y-16 relative z-10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <ClipboardCheck className="w-6 h-6 text-accent" />
                          <span className="meta-label !text-accent font-black">{t.cultivationPlan}</span>
                        </div>
                        <h2 className="font-serif text-6xl lg:text-8xl font-black text-ink">{t.lifecycleStrategy}</h2>
                      </div>
                      
                      <div className="grid gap-16">
                        {lifecycle.stages.map((stage: any, i: number) => (
                          <div key={i} className="grid grid-cols-[100px_1fr] gap-12 group">
                            <div className="text-7xl lg:text-9xl font-serif font-black text-line/40 italic leading-none group-hover:text-accent/20 transition-colors">{String(i + 1).padStart(2, '0')}</div>
                            <div className="space-y-6 pt-6 border-t-2 border-line group-hover:border-accent transition-colors">
                              <div className="flex justify-between items-baseline gap-4">
                                <h4 className="font-serif text-4xl lg:text-5xl font-black italic">{stage.stage}</h4>
                                <div className="h-px bg-line flex-1 hidden md:block opacity-30" />
                                <span className="meta-label bg-harvest/10 text-harvest px-4 py-1 rounded-full whitespace-nowrap">{stage.timing}</span>
                              </div>
                              <p className="text-xl lg:text-2xl font-serif italic leading-relaxed opacity-85 group-hover:opacity-100 transition-opacity max-w-3xl">{stage.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <aside className="relative z-10">
                      <div className="bg-ink text-white p-12 sticky top-28 rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center gap-4 border-b border-white/10 pb-6 mb-10">
                          <DollarSign className="w-6 h-6 text-harvest" />
                          <span className="meta-label !text-white/60 font-black">{t.economicProjections}</span>
                        </div>
                        
                        <div className="space-y-8 mb-16">
                           {[
                            { label: "Quality Seeds", value: lifecycle.costs.seeds, icon: <Sprout className="w-4 h-4" /> },
                            { label: "Fertilizers & Nutrients", value: lifecycle.costs.fertilizers, icon: <Leaf className="w-4 h-4" /> },
                            { label: "Irrigation Costs", value: lifecycle.costs.water, icon: <Droplets className="w-4 h-4" /> },
                            { label: "Labor & Maintenance", value: lifecycle.costs.labor, icon: <ClipboardCheck className="w-4 h-4" /> },
                           ].map((cost, i) => (
                             <div key={i} className="group cursor-default">
                               <div className="flex justify-between items-baseline mb-2">
                                 <span className="text-[11px] uppercase tracking-[0.25em] font-black opacity-60 flex items-center gap-2 group-hover:opacity-100 transition-opacity">
                                   {cost.icon} {cost.label}
                                 </span>
                                 <span className="font-serif text-2xl font-black italic text-harvest">₹{cost.value}</span>
                               </div>
                               <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   whileInView={{ width: `${Math.min(100, (cost.value / 25000) * 100)}%` }}
                                   className="h-full bg-harvest" 
                                 />
                               </div>
                             </div>
                           ))}
                        </div>

                        <div className="space-y-4 border-t-2 border-white/20 pt-10">
                          <div className="flex justify-between items-baseline">
                            <span className="font-serif text-3xl italic text-white/60">{t.totalExpense}</span>
                            <span className="text-5xl lg:text-6xl font-black text-harvest shadow-sm animate-pulse">₹{Object.values(lifecycle.costs).reduce((a: any, b: any) => a + b, 0)}</span>
                          </div>
                          <p className="text-[10px] uppercase tracking-[0.3em] opacity-30 mt-8 text-center italic font-bold">{t.calculatedFor}</p>
                        </div>
                      </div>
                    </aside>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : activeTab === "history" ? (
            <motion.div 
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-16"
            >
              <div className="border-b-4 border-ink pb-10 flex justify-between items-end">
                <div className="space-y-4">
                  <span className="meta-label block !text-accent font-black tracking-[0.4em]">{t.historicalRecords}</span>
                  <h2 className="font-serif text-7xl lg:text-9xl font-black italic tracking-tighter leading-tight pb-4">{t.archive}</h2>
                </div>
                <div className="text-right hidden md:block">
                  <span className="text-[10px] uppercase font-black opacity-20 tracking-[0.2em]">{t.logbook}</span>
                  <p className="font-serif italic text-lg opacity-40">{t.bureauRegistry}</p>
                </div>
              </div>

              <div className="grid gap-6">
                {history.length > 0 ? history.map((item, i) => {
                  const soil = JSON.parse(item.soil_data);
                  const result = JSON.parse(item.analysis);
                  return (
                    <motion.div 
                      key={item.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white border-2 border-line/50 p-10 flex flex-col md:flex-row md:items-center justify-between hover:border-accent hover:shadow-2xl hover:shadow-accent/5 transition-all group rounded-[2.5rem]"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-line/10 rounded-full flex items-center justify-center font-black text-xs text-ink/40">
                            #{String(item.id).padStart(3, '0')}
                          </div>
                          <span className="text-[11px] font-black italic uppercase opacity-60 tracking-widest">{new Date(item.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          <div className="h-[2px] w-12 bg-line/20" />
                          <span className="text-[10px] font-black uppercase text-leaf bg-leaf/10 px-3 py-1 rounded-full">{soil.soilType}</span>
                        </div>
                        <h4 className="font-serif text-4xl lg:text-5xl font-black italic group-hover:text-accent transition-colors flex flex-wrap items-center gap-3">
                          {result.soilCondition} <span className="text-xl opacity-40 font-sans not-italic uppercase tracking-widest font-black">{t.inCity}</span> {soil.district ? `${lang === "mr" && districtTranslations[soil.district] ? districtTranslations[soil.district] : soil.district}, ` : ''}{lang === "mr" && stateTranslations[item.region] ? stateTranslations[item.region].mr : item.region}
                        </h4>
                      </div>
                      <button 
                        onClick={() => {
                          setAnalysis(result);
                          setSoilData(soil);
                          setActiveTab("analyze");
                          window.scrollTo({ top: 400, behavior: "smooth" });
                        }}
                        className="mt-8 md:mt-0 px-12 py-5 bg-ink text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-accent hover:shadow-xl hover:shadow-accent/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                      >
                        <HistoryIcon className="w-5 h-5" />
                        {t.restoreRecord}
                      </button>
                    </motion.div>
                  );
                }) : (
                  <div className="bg-white/40 p-32 text-center rounded-[4rem] border-4 border-dashed border-line">
                    <p className="font-serif text-4xl italic opacity-30 font-black">{t.emptyArchive}</p>
                    <p className="text-[12px] uppercase font-black tracking-[0.4em] opacity-20 mt-6 italic">{t.bureauNoEntries}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === "labs" ? (
            <motion.div 
              key="labs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-16"
            >
              <div className="border-b-4 border-ink pb-10 flex justify-between items-end">
                <div className="space-y-4">
                  <span className="meta-label block !text-accent font-black tracking-[0.4em]">{t.labLocatorHeader}</span>
                  <h2 className="font-serif text-7xl lg:text-9xl font-black italic tracking-tighter leading-tight pb-4">{t.tabLabs}</h2>
                </div>
              </div>

              <div className="max-w-4xl space-y-12">
                <div className="bg-white border-2 border-line p-10 rounded-[3rem] shadow-xl space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
                      <MapPin className="w-8 h-8 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-serif text-3xl font-black italic">{t.searchAreaHeader}</h3>
                      <p className="text-sm font-black opacity-30 uppercase tracking-widest">{t.searchAreaSub}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-earth/50 tracking-widest">{t.labelState}</label>
                      <div className="relative">
                        <select 
                          value={labState}
                          onChange={(e) => {
                            setLabState(e.target.value);
                            setLabDistrict(""); // Reset district when state changes
                          }}
                          className="w-full bg-transparent border-b-2 border-line/40 py-2 text-lg font-serif font-black outline-none focus:border-accent transition-all appearance-none cursor-pointer pr-8"
                        >
                          <option value="">{t.selectState}</option>
                          {Object.keys(statesData).sort().map(state => (
                            <option key={state} value={state}>
                              {lang === "mr" && stateTranslations[state] ? stateTranslations[state].mr : state}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none opacity-30" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-earth/50 tracking-widest">{t.labelDistrict}</label>
                      <div className="relative">
                        <select 
                          value={labDistrict}
                          disabled={!labState}
                          onChange={(e) => setLabDistrict(e.target.value)}
                          className="w-full bg-transparent border-b-2 border-line/40 py-2 text-lg font-serif font-black outline-none focus:border-accent transition-all appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed pr-8"
                        >
                          <option value="">{t.selectDistrict}</option>
                          {labState && statesData[labState].sort().map(dist => (
                            <option key={dist} value={dist}>
                              {lang === "mr" && districtTranslations[dist] ? districtTranslations[dist] : dist}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none opacity-30" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-earth/50 tracking-widest">{t.labelPincode}</label>
                      <input 
                        type="text"
                        placeholder="e.g. 422001"
                        value={labPincode}
                        onChange={(e) => setLabPincode(e.target.value)}
                        className="w-full bg-transparent border-b-2 border-line/40 py-2 text-lg font-serif font-black outline-none focus:border-accent transition-all"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleFindLabs}
                    disabled={labLoading}
                    className="w-full bg-ink text-white px-10 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-accent transition-all active:scale-95 disabled:bg-line flex items-center justify-center gap-4"
                  >
                    {labLoading ? <Loader2 className="animate-spin w-6 h-6" /> : <><Search className="w-6 h-6" /> {t.findLabs}</>}
                  </button>
                </div>

                <div className="grid gap-8">
                  {labs.length > 0 ? labs.map((lab, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group bg-white border-2 border-line/50 p-10 rounded-[2.5rem] hover:border-accent hover:shadow-2xl transition-all grid md:grid-cols-[1fr_200px] gap-8 items-center"
                    >
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full ${lab.type === "Government" ? "bg-leaf/10 text-leaf" : "bg-harvest/10 text-harvest"}`}>
                            {lab.type}
                          </span>
                          <div className="h-px w-8 bg-line/20" />
                          <span className="text-[10px] font-black uppercase opacity-20 tracking-widest">{t.facilityValidated}</span>
                        </div>
                        <h4 className="font-serif text-4xl lg:text-5xl font-black italic group-hover:text-accent transition-colors">
                          {lab.name}
                        </h4>
                        <div className="flex flex-col md:flex-row gap-8 opacity-60">
                           <div className="flex items-start gap-3">
                             <MapPin className="w-5 h-5 shrink-0 text-accent" />
                             <p className="text-sm font-serif italic">{lab.address}</p>
                           </div>
                           <div className="flex items-center gap-3">
                             <div className="w-5 h-5 flex items-center justify-center">
                               <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                             </div>
                             <p className="text-sm font-black">{lab.contact}</p>
                           </div>
                        </div>
                      </div>
                      <div className="border-l-2 border-dashed border-line pl-8 hidden md:block group-hover:border-accent transition-colors">
                         <span className="text-[10px] font-black uppercase text-earth/40 block mb-2">{t.labType}</span>
                         <p className="font-serif text-xl font-black italic">{lab.type}</p>
                      </div>
                    </motion.div>
                  )) : !labLoading && labs.length === 0 && (labState || labDistrict || labPincode) && (
                    <div className="text-center py-24 opacity-30">
                       <Search className="w-16 h-16 mx-auto mb-6" />
                       <p className="font-serif text-2xl italic font-black">{t.noLabsFound}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="guide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-16"
            >
              {/* Header */}
              <div className="border-b-4 border-ink pb-10">
                <span className="meta-label block !text-accent font-black tracking-[0.4em] mb-4">{t.farmerEducation}</span>
                <h2 className="font-serif text-7xl lg:text-9xl font-black italic tracking-tighter leading-tight pb-4">{t.guideHeader}</h2>
              </div>

              {/* Top Section: Why Test? */}
              <div className="grid lg:grid-cols-[1fr_400px] gap-12">
                <div className="space-y-12">
                   <div className="bg-white border-2 border-line p-12 rounded-[3.5rem] shadow-inner">
                      <div className="flex items-center gap-4 mb-8">
                        <AlertCircle className="w-8 h-8 text-harvest" />
                        <h3 className="font-serif text-5xl font-black italic">{t.whyTestTitle}</h3>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                          { title: t.benefit1Title, desc: t.benefit1Desc, icon: <DollarSign className="w-6 h-6" /> },
                          { title: t.benefit2Title, desc: t.benefit2Desc, icon: <Droplets className="w-6 h-6" /> },
                          { title: t.benefit3Title, desc: t.benefit3Desc, icon: <Sprout className="w-6 h-6" /> }
                        ].map((benefit, i) => (
                          <div key={i} className="space-y-4 p-6 hover:bg-paper/50 rounded-2xl transition-colors group">
                            <div className="p-3 bg-accent/10 w-fit rounded-xl text-accent group-hover:scale-110 transition-transform">
                              {benefit.icon}
                            </div>
                            <h4 className="text-xl font-black">{benefit.title}</h4>
                            <p className="text-sm font-serif italic text-earth/80 leading-relaxed">{benefit.desc}</p>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>

                {/* Frequency Card */}
                <div className="bg-ink text-white p-12 rounded-[3.5rem] flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-8 -mt-8" />
                   <span className="meta-label !text-harvest mb-6 block font-black border-b border-white/10 pb-4">{t.freqTitle}</span>
                   <p className="font-serif text-2xl italic leading-relaxed opacity-90 relative z-10">
                     "{t.freqDesc}"
                   </p>
                </div>
              </div>

              {/* Bottom Section: What's Next? */}
              <div className="bg-white/40 p-16 rounded-[4rem] border-4 border-dashed border-line">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                  <div className="w-24 h-24 bg-leaf/10 rounded-full flex items-center justify-center mx-auto mb-10">
                    <ClipboardCheck className="w-12 h-12 text-leaf" />
                  </div>
                  <h3 className="font-serif text-6xl font-black italic">{t.whatNextTitle}</h3>
                  <p className="text-2xl font-serif italic text-earth/80 leading-relaxed max-w-2xl mx-auto">
                    {t.whatNextDesc}
                  </p>
                  <div className="pt-12 flex flex-wrap justify-center gap-8">
                     {[t.npkBalance, t.phCorrectionLabel, t.microNutrients, t.cropSelection].map((step, i) => (
                       <div key={i} className="flex items-center gap-3 group">
                         <div className="w-2 h-2 bg-harvest rounded-full transition-all group-hover:scale-150" />
                         <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 transition-opacity">{step}</span>
                       </div>
                     ))}
                  </div>
                </div>
              </div>

              {/* New Section: Collection Steps & Precautions */}
              <div className="grid lg:grid-cols-2 gap-12">
                {/* Steps */}
                <div className="bg-white border-2 border-line p-12 rounded-[3.5rem] space-y-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/10 rounded-xl text-accent">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif text-4xl font-black italic">{t.collectionStepsTitle}</h3>
                  </div>
                  <div className="space-y-6">
                    {[t.step1, t.step2, t.step3, t.step4, t.step5].map((step, i) => (
                      <div key={i} className="flex gap-6 group">
                        <span className="font-serif text-3xl font-black text-line/60 italic group-hover:text-accent/40 transition-colors">{i + 1}.</span>
                        <p className="text-lg font-serif italic text-earth/80 leading-relaxed pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Precautions */}
                <div className="bg-red-500 text-white p-12 rounded-[3.5rem] space-y-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-bl-full -mr-16 -mt-16" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif text-4xl font-black italic">{t.precautionsTitle}</h3>
                  </div>
                  <div className="space-y-8 relative z-10">
                    {[t.precaution1, t.precaution2, t.precaution3, t.precaution4].map((p, i) => (
                      <div key={i} className="flex gap-6 group">
                         <div className="w-2 h-2 bg-white/40 rounded-full mt-3 shrink-0" />
                         <p className="text-lg font-bold leading-tight">{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Fertilizer Calculator Modal */}
      <AnimatePresence>
        {showCalculator && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCalculator(false)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-paper w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl relative z-10 border border-line flex flex-col"
            >
              <div className="p-8 border-b border-line flex justify-between items-center bg-white/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-harvest/20 rounded-xl text-harvest">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-serif text-3xl font-black">{t.calcTitle}</h2>
                    <p className="text-[10px] uppercase font-bold text-earth/50 tracking-widest">{t.precisionDosage}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCalculator(false)}
                  className="p-3 hover:bg-line/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-12">
                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black uppercase text-earth/40 block mb-3 pl-1 tracking-widest">{t.calcCrop}</label>
                        <select 
                          value={calcCrop}
                          onChange={(e) => setCalcCrop(e.target.value)}
                          className="w-full bg-white border-2 border-line rounded-2xl p-4 text-lg font-black outline-none focus:border-accent appearance-none cursor-pointer"
                        >
                          <optgroup label={t.recommendedCrops}>
                            {analysis?.recommendations.map((crop: string) => (
                              <option key={crop} value={crop}>{crop}</option>
                            ))}
                          </optgroup>
                          <optgroup label={t.allIndianCrops}>
                            {indianCrops.filter(c => !analysis?.recommendations.includes(c.id)).map((crop) => (
                              <option key={crop.id} value={crop.id}>{lang === "mr" ? crop.mr : crop.en}</option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-earth/40 block mb-3 pl-1 tracking-widest">{t.calcAcreage}</label>
                        <div className="relative">
                          <input 
                            type="number"
                            value={isNaN(calcAcreage) ? "" : calcAcreage}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCalcAcreage(val === "" ? NaN : parseFloat(val));
                            }}
                            className="w-full bg-white border-2 border-line rounded-2xl p-4 text-2xl font-black outline-none focus:border-accent"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-serif italic text-earth/40">{t.acres}</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleCalculateFertilizer}
                      disabled={calcLoading}
                      className="w-full bg-accent text-white py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] hover:bg-leaf transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-4 active:scale-95 disabled:bg-line"
                    >
                      {calcLoading ? <Loader2 className="animate-spin w-6 h-6" /> : <><Calculator className="w-6 h-6" /> {t.calculate}</>}
                    </button>
                  </div>

                  <div className="bg-[#F2EFE9]/50 rounded-[2.5rem] p-8 border border-line">
                    <span className="meta-label !text-earth mb-6 block text-center border-b border-line pb-4">{t.soilAnalysisContext}</span>
                    <div className="grid grid-cols-2 gap-6">
                       {[
                         { label: t.phLevel, value: soilData.ph },
                         { label: t.nitrogen, value: soilData.nitrogen },
                         { label: t.phosphorus, value: soilData.phosphorus },
                         { label: t.potassium, value: soilData.potassium }
                       ].map((item, i) => (
                         <div key={i} className="text-center p-4 bg-white/40 rounded-2xl border border-line">
                            <span className="text-[10px] font-black uppercase text-earth/40 block mb-1">{item.label}</span>
                            <span className="text-xl font-serif font-black">{item.value}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                {calcResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid lg:grid-cols-2 gap-12 pt-12 border-t-2 border-line border-dashed"
                  >
                    <div className="space-y-8">
                       <div className="flex items-center gap-4">
                         <Zap className="w-6 h-6 text-harvest" />
                         <h4 className="font-serif text-3xl font-black italic">{t.chemicalTitle}</h4>
                       </div>
                       <div className="space-y-4">
                          {calcResult.chemicalOptions.map((opt: any, i: number) => (
                            <div key={i} className="bg-white p-8 rounded-3xl border-2 border-line hover:border-accent transition-colors group">
                               <div className="flex justify-between items-start mb-4">
                                 <h5 className="text-xl font-black">{opt.name}</h5>
                                 <div className="flex flex-col items-end gap-2">
                                   <span className="bg-harvest/10 text-harvest px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{opt.quantity}</span>
                                   <span className="text-[11px] font-black text-harvest/60">{t.phCost}: {opt.estimatedCost}</span>
                                 </div>
                               </div>
                               <p className="text-sm font-serif italic text-earth/60 leading-relaxed border-t border-line/40 pt-4 mt-4">
                                 {opt.applicationMethod}
                               </p>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-8">
                       <div className="flex items-center gap-4">
                         <Leaf className="w-6 h-6 text-leaf" />
                         <h4 className="font-serif text-3xl font-black italic text-leaf">{t.naturalTitle}</h4>
                       </div>
                       <div className="space-y-4">
                          {calcResult.naturalOptions.map((opt: any, i: number) => (
                            <div key={i} className="bg-white border-2 border-line p-8 rounded-3xl hover:border-leaf transition-colors group">
                               <div className="flex justify-between items-start mb-4">
                                 <h5 className="text-xl font-black text-leaf">{opt.name}</h5>
                                 <div className="flex flex-col items-end gap-2">
                                   <span className="bg-leaf/10 text-leaf px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{opt.quantity}</span>
                                   <span className="text-[11px] font-black text-leaf/60">{t.phCost}: {opt.estimatedCost}</span>
                                 </div>
                               </div>
                               <p className="text-sm font-serif italic text-earth/60 leading-relaxed border-t border-line/40 pt-4 mt-4">
                                 {opt.applicationMethod}
                               </p>
                            </div>
                          ))}
                       </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <footer className="max-w-7xl mx-auto px-8 py-12 flex flex-col md:flex-row items-center justify-between border-t border-line mt-24">
        <div className="flex items-center gap-4">
          <div className="bg-ink p-2 mb-4 md:mb-0">
            <Sprout className="text-white w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest leading-none">{t.title}</p>
            <p className="text-[9px] italic opacity-40">{t.bureauFooter}</p>
          </div>
        </div>
        
        <div className="flex gap-12 mt-8 md:mt-0">
          <div className="text-right">
            <span className="meta-label block mb-1">{t.edition}</span>
            <span className="text-xs font-bold font-serif italic">{t.globalSouth}</span>
          </div>
          <div className="text-right">
            <span className="meta-label block mb-1">{t.technique}</span>
            <span className="text-xs font-bold font-serif italic">{t.aiSynthesis}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const translations: any = {
  en: {
    systemName: "Agriculture Intelligence System",
    title: "Farmer Hand",
    heroSubtitle: "Cultivating your digital harvest with AI precision.",
    heroAction: "Analyze Your Land",
    tabAnalysis: "I. Analysis",
    tabRecords: "II. Records",
    inputMethods: "Input Methods",
    uploadReport: "Upload Report",
    scanReport: "Scan Survey Image",
    soilMetrics: "Soil Metrics",
    phLevel: "pH Level",
    nitrogen: "Nitrogen",
    phosphorus: "Phosphorus",
    potassium: "Potassium",
    soilTypology: "Soil Typology",
    region: "Geographic Region",
    generateReport: "Generate Report",
    surveyDecomp: "I. Survey Decomposition",
    botanicalRecs: "II. Botanical Recommendations",
    recommendedCrop: "Recommended Crop",
    exploreLifecycle: "Explore Lifecycle",
    inputStrategy: "Input Strategy",
    chemicalFormulas: "Chemical Formulas",
    organicPath: "Organic Path",
    naturalEnrichment: "Natural Enrichment",
    criticalObs: "Critical Observations",
    waitingData: "Waiting for survey data...",
    systemIdling: "System idling - Ready for input",
    cultivationPlan: "III. Cultivation Masterplan",
    lifecycleStrategy: "Lifecycle Strategy",
    economicProjections: "IV. Economic Projections",
    totalExpense: "Total Expense",
    calculatedFor: "Calculated for regional acreage standards",
    archive: "Archive 2024",
    historicalRecords: "Historical Records",
    tabGuide: "III. Guide",
    guideHeader: "Soil Intelligence Guide",
    whyTestTitle: "Why is Soil Testing Essential?",
    freqTitle: "How often should you test?",
    freqDesc: "Test your soil at least once a year, ideally after harvesting one crop and before sowing the next major season (Kharif or Rabi) to ensure the land has recovered its nutrients.",
    benefit1Title: "Nutrient Optimization",
    benefit1Desc: "Apply only what is missing. Stop wasting money on unnecessary fertilizers and protect the environment.",
    benefit2Title: "pH Balancing",
    benefit2Desc: "Control the acidity or alkalinity of your soil. Proper pH ensures that roots can actually absorb the nutrients you provide.",
    benefit3Title: "Yield Prediction",
    benefit3Desc: "Understand your soil's hidden potential to choose the most profitable crops for your specific land conditions.",
    whatNextTitle: "What happens after the test?",
    whatNextDesc: "The result gives you a surgical prescription—exactly how much Nitrogen, Phosphorus, and Potassium to apply, and whether you need to add Lime or Gypsum.",
    collectionStepsTitle: "How to Collect Soil Samples?",
    precautionsTitle: "Precautions During Collection",
    step1: "Choose the right time: Collect samples when the soil is at a workable moisture level, not too wet or too dry.",
    step2: "Mark the spot: Identify 8-10 random spots in a zig-zag pattern across your field for a representative sample.",
    step3: "Dig the hole: Use a shovel or auger to dig a V-shaped hole about 6-8 inches (15-20 cm) deep.",
    step4: "Take the slice: Remove a 1-inch thick slice of soil from the side of the hole.",
    step5: "Mix & Dry: Mix slices from all spots in a clean plastic bucket. Dry the composite sample in shade before packing.",
    precaution1: "Avoid unusual areas: Don't collect soil near fences, roads, manure piles, or trees.",
    precaution2: "Use clean tools: Ensure your shovel and bucket are clean and free of rust or old fertilizer.",
    precaution3: "No Metal Buckets: Use plastic containers only. Metal can contaminate the sample and skew results.",
    precaution4: "Proper Labeling: Label the sample bag with your name, date, field ID, and previous crop.",
    restoreRecord: "Restore Record",
    emptyArchive: "The archive is currently empty.",
    climateStatus: "Climate Status",
    weatherStable: "Stable conditions for sowing.",
    low: "Low",
    medium: "Medium",
    high: "High",
    openCalc: "Dosage Calculator",
    calcTitle: "Fertilizer Calculator",
    calcAcreage: "Land Acreage",
    calcCrop: "Target Crop",
    calculate: "Calculate Precise Dosage",
    chemicalTitle: "Synthetic Enrichment",
    naturalTitle: "Organic Alternatives",
    soilSummary: "Soil Analysis context",
    phCorrectionTitle: "pH Balance Correction",
    phTreatment: "Treatment Recommended",
    phQuantity: "Quantity Required",
    phCost: "Estimated Cost",
    phInstructions: "How to Apply",
    pastFiveDays: "Past 5 Days",
    forecastFiveDays: "Next 5 Days Prediction",
    tabLabs: "IV. Lab Locator",
    labLocatorHeader: "Regional Laboratory Index",
    searchArea: "Enter District or Pin Code",
    findLabs: "Initiate Search",
    labType: "Entity Type",
    labAddress: "Address",
    labContact: "Comm. Channel",
    labSearching: "Accessing Ag-Database...",
    noLabsFound: "Bureau reports no labs in this immediate area.",
    labelState: "State",
    labelDistrict: "District",
    labelPincode: "Pincode",
    searchAreaHeader: "Location Parameters",
    searchAreaSub: "Specify geographical coordinates",
    logbook: "Regional Logbook",
    bureauRegistry: "Agriculture Bureau of Registry",
    inCity: "in",
    bureauNoEntries: "No survey data documented in this bureau.",
    facilityValidated: "Validated Facility",
    farmerEducation: "Farmer Education",
    acres: "acres",
    bureauFooter: "Digital Agriculture Bureau § 2024",
    edition: "Edition",
    globalSouth: "Global South v1.0",
    technique: "Technique",
    aiSynthesis: "AI Synthesis",
    precisionDosage: "Precision Dosage Estimator",
    recommendedCrops: "Recommended Crops",
    allIndianCrops: "All Indian Crops",
    selectState: "Select State",
    selectDistrict: "Select District",
    satelliteLinkActive: "Satellite Link Active",
    waitingProtocol: "Waiting for Protocol",
    surveyId: "Master Analysis #",
    diagnosticResult: "Diagnostic Result",
    satelliteFetching: "Fetching Satellite Data...",
    satelliteOffline: "Satellite Feed Offline",
    recommendedBioAsset: "Recommended Bio-Asset",
    soilAnalysisContext: "Soil Analysis context",
    syntheticEnrichment: "Synthetic Enrichment",
    naturalPath: "Natural Path",
    applyNow: "Apply Now",
    npkBalance: "NPK Balance",
    phCorrectionLabel: "pH Correction",
    microNutrients: "Micro-Nutrients",
    cropSelection: "Crop Selection"
  },
  mr: {
    systemName: "कृषी बुद्धिमत्ता प्रणाली",
    title: "शेतकरी मदतनीस",
    heroSubtitle: "AI अचूकतेसह तुमचे डिजिटल उत्पादन वाढवा.",
    heroAction: "माती परीक्षण करा",
    tabAnalysis: "I. विश्लेषण",
    tabRecords: "II. रेकॉर्ड्स",
    inputMethods: "माहिती भरण्याच्या पद्धती",
    uploadReport: "रिपोर्ट अपलोड करा",
    scanReport: "सर्व्हे इमेज स्कॅन करा",
    soilMetrics: "मातीचे मापदंड",
    phLevel: "pH पातळी",
    nitrogen: "नायट्रोजन (नत्र)",
    phosphorus: "फॉस्फरस (स्फुरद)",
    potassium: "पोटॅशियम (पालाश)",
    soilTypology: "मातीचा प्रकार",
    region: "भौगोलिक क्षेत्र",
    generateReport: "रिपोर्ट तयार करा",
    surveyDecomp: "I. मातीचे विश्लेषण",
    botanicalRecs: "II. सुचवलेली पिके",
    recommendedCrop: "शिफारस केलेले पीक",
    exploreLifecycle: "जीवनचक्र पहा",
    inputStrategy: "खत व्यवस्थापन",
    chemicalFormulas: "रासायनिक खते",
    organicPath: "सेंद्रिय मार्ग",
    naturalEnrichment: "नैसर्गिक खते",
    criticalObs: "महत्वाचे निरीक्षणे",
    waitingData: "माहितीची प्रतीक्षा आहे...",
    systemIdling: "प्रणाली सज्ज आहे - माहिती भरा",
    cultivationPlan: "III. शेती नियोजन",
    lifecycleStrategy: "पीक जीवनचक्र",
    economicProjections: "IV. आर्थिक अंदाज",
    totalExpense: "एकूण खर्च",
    calculatedFor: "प्रादेशिक क्षेत्र मानकांनुसार गणना केली",
    archive: "संग्रह २०२४",
    historicalRecords: "ऐतिहासिक रेकॉर्ड्स",
    tabGuide: "III. मार्गदर्शन",
    guideHeader: "माती परीक्षण मार्गदर्शिका",
    whyTestTitle: "माती परीक्षण का आवश्यक आहे?",
    freqTitle: "किती वेळा परीक्षण करावे?",
    freqDesc: "वर्षातून किमान एकदा माती परीक्षण करावे. शक्यतो खरीप किंवा रब्बी हंगामापूर्वी परीक्षण केल्यास पिकाला आवश्यक पोषक तत्वांचे अचूक नियोजन करता येईल.",
    benefit1Title: "खतांची बचत",
    benefit1Desc: "जमिनीला ज्या घटकाची कमतरता आहे तेवढेच खत द्या. अनावश्यक खतांवर होणारा खर्च वाचवा आणि जमिनीचा पोत सुधारा.",
    benefit2Title: "सामू (pH) समतोल",
    benefit2Desc: "जमिनीचा सामू (pH) तपासल्यामुळे मुळांना खते शोषून घेणे सोपे जाते. आम्ल किंवा विम्ल जमिनीची सुधारणा करता येते.",
    benefit3Title: "उत्पादनात वाढ",
    benefit3Desc: "तुमच्या जमिनीची खरी क्षमता ओळखा आणि त्यानुसार सर्वाधिक नफा देणाऱ्या पिकाची निवड करा.",
    whatNextTitle: "परीक्षणानंतर पुढे काय?",
    whatNextDesc: "परीक्षणातून तुम्हाला जमिनीचा 'आरोग्य पत्रिका' मिळते. त्यावरून नत्र, स्फुरद आणि पालाशचे प्रमाण निश्चित करून खतांचे अचूक वेळापत्रक आखता येते.",
    collectionStepsTitle: "मातीचा नमुना कसा घ्यावा?",
    precautionsTitle: "नमुना घेताना घ्यायची काळजी",
    step1: "योग्य वेळ निवडा: जमीन खूप ओली किंवा खूप कोरडी नसावी. वाफसा असताना नमुना घ्यावा.",
    step2: "जागा निश्चित करा: शेतात नागमोडी (Zig-zag) पद्धतीने ८-१० ठिकाणे निवडा.",
    step3: "खड्डा खणा: फावडे किंवा खुरप्याच्या सहाय्याने 'V' आकाराचा ६-८ इंच खोल खड्डा करा.",
    step4: "मातीचा थर काढा: खड्ड्याच्या कडेचा १ इंच जाडीचा मातीचा थर वरपासून खालपर्यंत खरवडून काढा.",
    step5: "मिश्रण आणि वाळवणे: सर्व ठिकाणची माती एका प्लास्टिक बादलीत जमा करून सावलीत वाळवा.",
    precaution1: "विशिष्ट जागा टाळा: बांधाजवळ, रस्त्याजवळ, खताच्या ढिगाऱ्याजवळ किंवा झाडाखालील माती घेऊ नका.",
    precaution2: "स्वच्छ साधने वापरा: नमुना घेण्यासाठी वापरली जाणारी साधने स्वच्छ आणि गंजमुक्त असावीत.",
    precaution3: "धातूची बादली टाळा: माती जमा करण्यासाठी फक्त प्लास्टिकच्या बादलीचाच वापर करा.",
    precaution4: "योग्य लेबल लावा: पिशवीवर आपले नाव, तारीख, गट क्रमांक आणि मागील पीक याची नोंद करा.",
    restoreRecord: "रेकॉर्ड पहा",
    emptyArchive: "संग्रह सध्या रिकामा आहे.",
    climateStatus: "हवामान स्थिती",
    weatherStable: "पेरणीसाठी पोषक हवामान.",
    low: "कमी",
    medium: "मध्यम",
    high: "भरपूर",
    openCalc: "डोस कॅल्क्युलेटर",
    calcTitle: "खत गणना",
    calcAcreage: "जमिनीचे क्षेत्रफळ (एकर)",
    calcCrop: "निवडलेले पीक",
    calculate: "अचूक डोस मोजा",
    chemicalTitle: "रासायनिक पर्याय",
    naturalTitle: "सेंद्रिय पर्याय",
    soilSummary: "माती परीक्षण सारांश",
    phCorrectionTitle: "pH समतोल सुधारणा",
    phTreatment: "शिफारस केलेले उपचार",
    phQuantity: "आवश्यक प्रमाण (एकर)",
    phCost: "अंदाजे खर्च",
    phInstructions: "कसे वापरावे",
    pastFiveDays: "मागील ५ दिवस",
    forecastFiveDays: "पुढील ५ दिवसांचा अंदाज",
    tabLabs: "IV. लॅब शोधक",
    labLocatorHeader: "प्रादेशिक प्रयोगशाळा सूची",
    searchArea: "जिल्हा किंवा पिन कोड टाका",
    findLabs: "शोध सुरू करा",
    labType: "संस्था प्रकार",
    labAddress: "पत्ता",
    labContact: "संपर्क माध्यम",
    labSearching: "डेटाबेस शोधत आहे...",
    noLabsFound: "या क्षेत्रात प्रयोगशाळा सापडली नाहीत.",
    labelState: "राज्य",
    labelDistrict: "जिल्हा",
    labelPincode: "पिन कोड",
    searchAreaHeader: "स्थान तपशील",
    searchAreaSub: "भौगोलिक माहिती प्रदान करा",
    logbook: "प्रादेशिक लॉगबुक",
    bureauRegistry: "कृषी नोंदणी विभाग",
    inCity: "येथील",
    bureauNoEntries: "या विभागात कोणतीही सर्वेक्षण माहिती नोंदवलेली नाही.",
    facilityValidated: "प्रमाणित सुविधा",
    farmerEducation: "शेतकरी शिक्षण",
    acres: "एकर",
    bureauFooter: "डिजिटल कृषी विभाग § २०२४",
    edition: "आवृत्ती",
    globalSouth: "ग्लोबल साउथ v१.०",
    technique: "तंत्र",
    aiSynthesis: "AI विश्लेषण",
    precisionDosage: "अचूक डोस अंदाजक",
    recommendedCrops: "शिफारस केलेली पिके",
    allIndianCrops: "सर्व भारतीय पिके",
    selectState: "राज्य निवडा",
    selectDistrict: "जिल्हा निवडा",
    satelliteLinkActive: "सॅटेलाईट लिंक सक्रिय",
    waitingProtocol: "प्रतीक्षा संप्रेषण",
    surveyId: "मास्टर विश्लेषण #",
    diagnosticResult: "निदान निकाल",
    satelliteFetching: "उपग्रह डेटा प्राप्त करत आहे...",
    satelliteOffline: "उपग्रह फीड ऑफलाईन",
    recommendedBioAsset: "शिफारस केलेले जैविक घटक",
    soilAnalysisContext: "माती विश्लेषण संदर्भ",
    syntheticEnrichment: "सिंथेटिक समृद्धी",
    naturalPath: "नैसर्गिक मार्ग",
    applyNow: "आता लागू करा",
    npkBalance: "NPK समतोल",
    phCorrectionLabel: "pH सुधारणा",
    microNutrients: "सूक्ष्म पोषक तत्वे",
    cropSelection: "पीक निवड"
  }
};
