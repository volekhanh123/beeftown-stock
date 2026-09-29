using System.CodeDom.Compiler;
using System.Collections.Specialized;
using System.Configuration;
using System.Diagnostics;
using System.Drawing;
using System.IO.Ports;
using System.Runtime.CompilerServices;

namespace ECS.Properties;

[CompilerGenerated]
[GeneratedCode("Microsoft.VisualStudio.Editors.SettingsDesigner.SettingsSingleFileGenerator", "10.0.0.0")]
internal sealed class Settings : ApplicationSettingsBase
{
	private static Settings defaultInstance = (Settings)SettingsBase.Synchronized(new Settings());

	public static Settings Default => defaultInstance;

	[DefaultSettingValue("logoPictureBox.png")]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	public string elogoPictureBox => (string)this["elogoPictureBox"];

	[ApplicationScopedSetting]
	[DefaultSettingValue("99")]
	[DebuggerNonUserCode]
	public int maxDeptID => (int)this["maxDeptID"];

	[DefaultSettingValue("99999999")]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	public int maxPLURemark => (int)this["maxPLURemark"];

	[DebuggerNonUserCode]
	[DefaultSettingValue("9999999")]
	[ApplicationScopedSetting]
	public decimal maxPLUPrice => (decimal)this["maxPLUPrice"];

	[ApplicationScopedSetting]
	[DefaultSettingValue("9999999")]
	[DebuggerNonUserCode]
	public decimal maxPLUCost => (decimal)this["maxPLUCost"];

	[DefaultSettingValue("9999")]
	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	public int maxPLUTare => (int)this["maxPLUTare"];

	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	[DefaultSettingValue("99")]
	public int maxUnitID => (int)this["maxUnitID"];

	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("10000")]
	public int maxUnitPack => (int)this["maxUnitPack"];

	[DebuggerNonUserCode]
	[DefaultSettingValue("99")]
	[ApplicationScopedSetting]
	public int maxBarcodeID => (int)this["maxBarcodeID"];

	[DefaultSettingValue("99")]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	public int maxLabelID => (int)this["maxLabelID"];

	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	[DefaultSettingValue("9999")]
	public int maxBarFlag => (int)this["maxBarFlag"];

	[DebuggerNonUserCode]
	[DefaultSettingValue("9")]
	[ApplicationScopedSetting]
	public int maxBarcodeLength => (int)this["maxBarcodeLength"];

	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("9")]
	public int maxBarcodeShift => (int)this["maxBarcodeShift"];

	[ApplicationScopedSetting]
	[DefaultSettingValue("9")]
	[DebuggerNonUserCode]
	public int minDeptID => (int)this["minDeptID"];

	[DefaultSettingValue("10")]
	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	public int minUserDeptID => (int)this["minUserDeptID"];

	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	[DefaultSettingValue("1")]
	public int minUserPLUID => (int)this["minUserPLUID"];

	[DefaultSettingValue("10")]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	public int minUserUnitID => (int)this["minUserUnitID"];

	[DebuggerNonUserCode]
	[DefaultSettingValue("10")]
	[ApplicationScopedSetting]
	public int minUserBarcodeID => (int)this["minUserBarcodeID"];

	[DefaultSettingValue("10")]
	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	public int minUserLabelID => (int)this["minUserLabelID"];

	[ApplicationScopedSetting]
	[DefaultSettingValue("1")]
	[DebuggerNonUserCode]
	public int minUserSalesmanID => (int)this["minUserSalesmanID"];

	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("9999999")]
	public int maxSalesmanID => (int)this["maxSalesmanID"];

	[DefaultSettingValue("99")]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	public int maxImageID => (int)this["maxImageID"];

	[DefaultSettingValue("")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public string configFolder
	{
		get
		{
			return (string)this["configFolder"];
		}
		set
		{
			this["configFolder"] = value;
		}
	}

	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	[DefaultSettingValue("9")]
	public int minClassID => (int)this["minClassID"];

	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	[DefaultSettingValue("10")]
	public int minUserClassID => (int)this["minUserClassID"];

	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("999")]
	public int maxPrintDate => (int)this["maxPrintDate"];

	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("2048")]
	public int maxLabelWidth => (int)this["maxLabelWidth"];

	[DebuggerNonUserCode]
	[DefaultSettingValue("0")]
	[ApplicationScopedSetting]
	public int minLabelWidth => (int)this["minLabelWidth"];

	[DefaultSettingValue("0")]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	public int minLabelHeight => (int)this["minLabelHeight"];

	[DefaultSettingValue("Times New Roman, 12pt")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public Font faceFont
	{
		get
		{
			return (Font)this["faceFont"];
		}
		set
		{
			this["faceFont"] = value;
		}
	}

	[ApplicationScopedSetting]
	[DefaultSettingValue("999")]
	[DebuggerNonUserCode]
	public int maxClassID => (int)this["maxClassID"];

	[DefaultSettingValue("Default")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public string fileName
	{
		get
		{
			return (string)this["fileName"];
		}
		set
		{
			this["fileName"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("2")]
	public int Format_Price
	{
		get
		{
			return (int)this["Format_Price"];
		}
		set
		{
			this["Format_Price"] = value;
		}
	}

	[UserScopedSetting]
	[DefaultSettingValue("3")]
	[DebuggerNonUserCode]
	public int Format_Weight
	{
		get
		{
			return (int)this["Format_Weight"];
		}
		set
		{
			this["Format_Weight"] = value;
		}
	}

	[ApplicationScopedSetting]
	[DefaultSettingValue("99")]
	[DebuggerNonUserCode]
	public int maxLabelItemID => (int)this["maxLabelItemID"];

	[SpecialSetting(SpecialSetting.ConnectionString)]
	[DebuggerNonUserCode]
	[DefaultSettingValue("Provider=Microsoft.Jet.OLEDB.4.0;Data Source=|DataDirectory|\\ECS.mdb")]
	[ApplicationScopedSetting]
	public string ECSConnectionString => (string)this["ECSConnectionString"];

	[DefaultSettingValue("33581")]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	public int tcpClientPort => (int)this["tcpClientPort"];

	[DebuggerNonUserCode]
	[DefaultSettingValue("33582")]
	[ApplicationScopedSetting]
	public int tcpServerPort => (int)this["tcpServerPort"];

	[DefaultSettingValue("33583")]
	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	public int udpBroadcastPort => (int)this["udpBroadcastPort"];

	[DebuggerNonUserCode]
	[DefaultSettingValue("33584")]
	[ApplicationScopedSetting]
	public int udpRecvPort => (int)this["udpRecvPort"];

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("<?xml version=\"1.0\" encoding=\"utf-16\"?>\r\n<ArrayOfString xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" />")]
	public StringCollection ipList
	{
		get
		{
			return (StringCollection)this["ipList"];
		}
		set
		{
			this["ipList"] = value;
		}
	}

	[DefaultSettingValue("255.255.255.255")]
	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	public string udpBroadIP => (string)this["udpBroadIP"];

	[DebuggerNonUserCode]
	[DefaultSettingValue("9600")]
	[UserScopedSetting]
	public int serailBaudRate
	{
		get
		{
			return (int)this["serailBaudRate"];
		}
		set
		{
			this["serailBaudRate"] = value;
		}
	}

	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("8")]
	public int serialDataBits => (int)this["serialDataBits"];

	[DefaultSettingValue("XOnXOff")]
	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	public Handshake serialHandShake => (Handshake)this["serialHandShake"];

	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("None")]
	public Parity serialParity => (Parity)this["serialParity"];

	[DefaultSettingValue("One")]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	public StopBits serialStopBits => (StopBits)this["serialStopBits"];

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool Enable_Wizard
	{
		get
		{
			return (bool)this["Enable_Wizard"];
		}
		set
		{
			this["Enable_Wizard"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool Enable_TMS
	{
		get
		{
			return (bool)this["Enable_TMS"];
		}
		set
		{
			this["Enable_TMS"] = value;
		}
	}

	[DebuggerNonUserCode]
	[UserScopedSetting]
	[DefaultSettingValue("True")]
	public bool Enable_TMT
	{
		get
		{
			return (bool)this["Enable_TMT"];
		}
		set
		{
			this["Enable_TMT"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public bool Enable_Dept
	{
		get
		{
			return (bool)this["Enable_Dept"];
		}
		set
		{
			this["Enable_Dept"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public bool Enable_Class
	{
		get
		{
			return (bool)this["Enable_Class"];
		}
		set
		{
			this["Enable_Class"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public bool Enable_PLU
	{
		get
		{
			return (bool)this["Enable_PLU"];
		}
		set
		{
			this["Enable_PLU"] = value;
		}
	}

	[DebuggerNonUserCode]
	[UserScopedSetting]
	[DefaultSettingValue("True")]
	public bool Enable_SCP
	{
		get
		{
			return (bool)this["Enable_SCP"];
		}
		set
		{
			this["Enable_SCP"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool Enable_Label
	{
		get
		{
			return (bool)this["Enable_Label"];
		}
		set
		{
			this["Enable_Label"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	[UserScopedSetting]
	public bool Enable_Barcode
	{
		get
		{
			return (bool)this["Enable_Barcode"];
		}
		set
		{
			this["Enable_Barcode"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool Enable_Unit
	{
		get
		{
			return (bool)this["Enable_Unit"];
		}
		set
		{
			this["Enable_Unit"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool Enable_Salesman
	{
		get
		{
			return (bool)this["Enable_Salesman"];
		}
		set
		{
			this["Enable_Salesman"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool Enable_VIP
	{
		get
		{
			return (bool)this["Enable_VIP"];
		}
		set
		{
			this["Enable_VIP"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	[UserScopedSetting]
	public bool Enable_Custum1
	{
		get
		{
			return (bool)this["Enable_Custum1"];
		}
		set
		{
			this["Enable_Custum1"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public bool Enable_Custum2
	{
		get
		{
			return (bool)this["Enable_Custum2"];
		}
		set
		{
			this["Enable_Custum2"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	[UserScopedSetting]
	public bool Enable_Custum3
	{
		get
		{
			return (bool)this["Enable_Custum3"];
		}
		set
		{
			this["Enable_Custum3"] = value;
		}
	}

	[UserScopedSetting]
	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	public bool Enable_Custum4
	{
		get
		{
			return (bool)this["Enable_Custum4"];
		}
		set
		{
			this["Enable_Custum4"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	public bool Enable_Tool => (bool)this["Enable_Tool"];

	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	public bool Enable_ExcelFile => (bool)this["Enable_ExcelFile"];

	[DefaultSettingValue("True")]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	public bool Enable_CustomFile => (bool)this["Enable_CustomFile"];

	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool Enable_CHM => (bool)this["Enable_CHM"];

	[ApplicationScopedSetting]
	[DefaultSettingValue("False")]
	[DebuggerNonUserCode]
	public bool Enable_Custom => (bool)this["Enable_Custom"];

	[DefaultSettingValue("False")]
	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	public bool Enable_Flag => (bool)this["Enable_Flag"];

	[ApplicationScopedSetting]
	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	public bool Visible_Wizard => (bool)this["Visible_Wizard"];

	[ApplicationScopedSetting]
	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	public bool Visible_TMS => (bool)this["Visible_TMS"];

	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	[ApplicationScopedSetting]
	public bool Visible_TMT => (bool)this["Visible_TMT"];

	[DefaultSettingValue("True")]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	public bool Visible_Dept => (bool)this["Visible_Dept"];

	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	public bool Visible_Class => (bool)this["Visible_Class"];

	[DefaultSettingValue("True")]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	public bool Visible_PLU => (bool)this["Visible_PLU"];

	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	[ApplicationScopedSetting]
	public bool Visible_PLU_Other => (bool)this["Visible_PLU_Other"];

	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	[ApplicationScopedSetting]
	public bool Visible_SCP => (bool)this["Visible_SCP"];

	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	[DefaultSettingValue("True")]
	public bool Visible_Label => (bool)this["Visible_Label"];

	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	[ApplicationScopedSetting]
	public bool Visible_Barcode => (bool)this["Visible_Barcode"];

	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	[ApplicationScopedSetting]
	public bool Visible_Unit => (bool)this["Visible_Unit"];

	[DefaultSettingValue("True")]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	public bool Visible_Salesman => (bool)this["Visible_Salesman"];

	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	[DefaultSettingValue("True")]
	public bool Visible_VIP => (bool)this["Visible_VIP"];

	[DefaultSettingValue("ScPLU_KAB")]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	public string defaultSCP => (string)this["defaultSCP"];

	[DefaultSettingValue("1024")]
	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	public int recvBufSize => (int)this["recvBufSize"];

	[DefaultSettingValue("1024")]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	public int sendBufSize => (int)this["sendBufSize"];

	[DebuggerNonUserCode]
	[SpecialSetting(SpecialSetting.ConnectionString)]
	[DefaultSettingValue("Provider=Microsoft.Jet.OLEDB.4.0;Data Source=|DataDirectory|\\Report.mdb")]
	[ApplicationScopedSetting]
	public string ReportConnectionString => (string)this["ReportConnectionString"];

	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("0")]
	public int clearRight => (int)this["clearRight"];

	[DefaultSettingValue("False")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public bool dirty
	{
		get
		{
			return (bool)this["dirty"];
		}
		set
		{
			this["dirty"] = value;
		}
	}

	[DebuggerNonUserCode]
	[UserScopedSetting]
	[DefaultSettingValue("True")]
	public bool alwaysShowDirty
	{
		get
		{
			return (bool)this["alwaysShowDirty"];
		}
		set
		{
			this["alwaysShowDirty"] = value;
		}
	}

	[ApplicationScopedSetting]
	[DefaultSettingValue("False")]
	[DebuggerNonUserCode]
	public bool preemptive => (bool)this["preemptive"];

	[DefaultSettingValue("False")]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	public bool manualBroadcast => (bool)this["manualBroadcast"];

	[DebuggerNonUserCode]
	[DefaultSettingValue("4096")]
	[ApplicationScopedSetting]
	public int maxLabelHeight => (int)this["maxLabelHeight"];

	[DefaultSettingValue("999999999")]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	public int maxBarcodeNum => (int)this["maxBarcodeNum"];

	[DebuggerNonUserCode]
	[DefaultSettingValue("30000")]
	[ApplicationScopedSetting]
	public int recvTimeOut => (int)this["recvTimeOut"];

	[DebuggerNonUserCode]
	[DefaultSettingValue("30000")]
	[ApplicationScopedSetting]
	public int sendTimeOut => (int)this["sendTimeOut"];

	[DebuggerNonUserCode]
	[DefaultSettingValue("Page 1")]
	[ApplicationScopedSetting]
	public string defaultSCP_Page => (string)this["defaultSCP_Page"];

	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool quickSettingClear
	{
		get
		{
			return (bool)this["quickSettingClear"];
		}
		set
		{
			this["quickSettingClear"] = value;
		}
	}

	[DefaultSettingValue("C:\\JHScale.txt")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public string txtfilePath
	{
		get
		{
			return (string)this["txtfilePath"];
		}
		set
		{
			this["txtfilePath"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("")]
	public string txtfileFormat
	{
		get
		{
			return (string)this["txtfileFormat"];
		}
		set
		{
			this["txtfileFormat"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool txtfileUpdate
	{
		get
		{
			return (bool)this["txtfileUpdate"];
		}
		set
		{
			this["txtfileUpdate"] = value;
		}
	}

	[DefaultSettingValue("False")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool txtfileClear
	{
		get
		{
			return (bool)this["txtfileClear"];
		}
		set
		{
			this["txtfileClear"] = value;
		}
	}

	[ApplicationScopedSetting]
	[DefaultSettingValue("1")]
	[DebuggerNonUserCode]
	public int defaultUnitID => (int)this["defaultUnitID"];

	[UserScopedSetting]
	[DefaultSettingValue("False")]
	[DebuggerNonUserCode]
	public bool excelfileClear
	{
		get
		{
			return (bool)this["excelfileClear"];
		}
		set
		{
			this["excelfileClear"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool excelfileUpdate
	{
		get
		{
			return (bool)this["excelfileUpdate"];
		}
		set
		{
			this["excelfileUpdate"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("C:\\JHScale.xls")]
	public string excelfilePath
	{
		get
		{
			return (string)this["excelfilePath"];
		}
		set
		{
			this["excelfilePath"] = value;
		}
	}

	[DefaultSettingValue("")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public string lastSCP
	{
		get
		{
			return (string)this["lastSCP"];
		}
		set
		{
			this["lastSCP"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("")]
	[UserScopedSetting]
	public string lastSCP_Page
	{
		get
		{
			return (string)this["lastSCP_Page"];
		}
		set
		{
			this["lastSCP_Page"] = value;
		}
	}

	[DefaultSettingValue("ftp://")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public string ftpurl
	{
		get
		{
			return (string)this["ftpurl"];
		}
		set
		{
			this["ftpurl"] = value;
		}
	}

	[DefaultSettingValue("")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public string ftpuser
	{
		get
		{
			return (string)this["ftpuser"];
		}
		set
		{
			this["ftpuser"] = value;
		}
	}

	[UserScopedSetting]
	[DefaultSettingValue("")]
	[DebuggerNonUserCode]
	public string ftppass
	{
		get
		{
			return (string)this["ftppass"];
		}
		set
		{
			this["ftppass"] = value;
		}
	}

	[DefaultSettingValue("0")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public int ftptarget
	{
		get
		{
			return (int)this["ftptarget"];
		}
		set
		{
			this["ftptarget"] = value;
		}
	}

	[ApplicationScopedSetting]
	[DefaultSettingValue("9999999")]
	[DebuggerNonUserCode]
	public decimal maxPLUID => (decimal)this["maxPLUID"];

	[DefaultSettingValue("9999990")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public decimal maxUserPLUID
	{
		get
		{
			return (decimal)this["maxUserPLUID"];
		}
		set
		{
			this["maxUserPLUID"] = value;
		}
	}

	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool fucLabelReID => (bool)this["fucLabelReID"];

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("Default")]
	public string ScFile_ScaleID
	{
		get
		{
			return (string)this["ScFile_ScaleID"];
		}
		set
		{
			this["ScFile_ScaleID"] = value;
		}
	}

	[DebuggerNonUserCode]
	[UserScopedSetting]
	[DefaultSettingValue("False")]
	public bool gen_AlwaysTray
	{
		get
		{
			return (bool)this["gen_AlwaysTray"];
		}
		set
		{
			this["gen_AlwaysTray"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool gen_TipOfTray
	{
		get
		{
			return (bool)this["gen_TipOfTray"];
		}
		set
		{
			this["gen_TipOfTray"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("False")]
	public bool reboot
	{
		get
		{
			return (bool)this["reboot"];
		}
		set
		{
			this["reboot"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	public Font CustomFont
	{
		get
		{
			return (Font)this["CustomFont"];
		}
		set
		{
			this["CustomFont"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("")]
	public string configEncoding
	{
		get
		{
			return (string)this["configEncoding"];
		}
		set
		{
			this["configEncoding"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("")]
	[UserScopedSetting]
	public string configName
	{
		get
		{
			return (string)this["configName"];
		}
		set
		{
			this["configName"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool excelfileAutoClear
	{
		get
		{
			return (bool)this["excelfileAutoClear"];
		}
		set
		{
			this["excelfileAutoClear"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	[UserScopedSetting]
	public bool txtfileAutoClear
	{
		get
		{
			return (bool)this["txtfileAutoClear"];
		}
		set
		{
			this["txtfileAutoClear"] = value;
		}
	}

	[DefaultSettingValue("10000")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public int minLabelID_Template
	{
		get
		{
			return (int)this["minLabelID_Template"];
		}
		set
		{
			this["minLabelID_Template"] = value;
		}
	}

	[DefaultSettingValue("19999")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public int maxLabelID_Template
	{
		get
		{
			return (int)this["maxLabelID_Template"];
		}
		set
		{
			this["maxLabelID_Template"] = value;
		}
	}

	[DebuggerNonUserCode]
	[UserScopedSetting]
	[DefaultSettingValue("90000")]
	public int minLabelID_Recycled
	{
		get
		{
			return (int)this["minLabelID_Recycled"];
		}
		set
		{
			this["minLabelID_Recycled"] = value;
		}
	}

	[UserScopedSetting]
	[DefaultSettingValue("90099")]
	[DebuggerNonUserCode]
	public int maxLabelID_Recycled
	{
		get
		{
			return (int)this["maxLabelID_Recycled"];
		}
		set
		{
			this["maxLabelID_Recycled"] = value;
		}
	}

	[UserScopedSetting]
	[DefaultSettingValue("False")]
	[DebuggerNonUserCode]
	public bool gen_MultiStock
	{
		get
		{
			return (bool)this["gen_MultiStock"];
		}
		set
		{
			this["gen_MultiStock"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool gen_DockingEthernet
	{
		get
		{
			return (bool)this["gen_DockingEthernet"];
		}
		set
		{
			this["gen_DockingEthernet"] = value;
		}
	}

	[UserScopedSetting]
	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	public bool MFR_L_Amount
	{
		get
		{
			return (bool)this["MFR_L_Amount"];
		}
		set
		{
			this["MFR_L_Amount"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("False")]
	public bool MFR_L_AffiliatedClass
	{
		get
		{
			return (bool)this["MFR_L_AffiliatedClass"];
		}
		set
		{
			this["MFR_L_AffiliatedClass"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("False")]
	[UserScopedSetting]
	public bool MFR_L_RelatedFID
	{
		get
		{
			return (bool)this["MFR_L_RelatedFID"];
		}
		set
		{
			this["MFR_L_RelatedFID"] = value;
		}
	}

	[DebuggerNonUserCode]
	[UserScopedSetting]
	[DefaultSettingValue("True")]
	public bool MFR_L_DateTime
	{
		get
		{
			return (bool)this["MFR_L_DateTime"];
		}
		set
		{
			this["MFR_L_DateTime"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("False")]
	public bool MFR_L_AffiliatedDept
	{
		get
		{
			return (bool)this["MFR_L_AffiliatedDept"];
		}
		set
		{
			this["MFR_L_AffiliatedDept"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	[UserScopedSetting]
	public bool MFR_L_FID
	{
		get
		{
			return (bool)this["MFR_L_FID"];
		}
		set
		{
			this["MFR_L_FID"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public bool MFR_L_DeviceName
	{
		get
		{
			return (bool)this["MFR_L_DeviceName"];
		}
		set
		{
			this["MFR_L_DeviceName"] = value;
		}
	}

	[DebuggerNonUserCode]
	[UserScopedSetting]
	[DefaultSettingValue("True")]
	public bool MFR_L_PLUName
	{
		get
		{
			return (bool)this["MFR_L_PLUName"];
		}
		set
		{
			this["MFR_L_PLUName"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool MFR_L_PLUNo
	{
		get
		{
			return (bool)this["MFR_L_PLUNo"];
		}
		set
		{
			this["MFR_L_PLUNo"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool MFR_L_MAC
	{
		get
		{
			return (bool)this["MFR_L_MAC"];
		}
		set
		{
			this["MFR_L_MAC"] = value;
		}
	}

	[UserScopedSetting]
	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	public bool MFR_L_Money
	{
		get
		{
			return (bool)this["MFR_L_Money"];
		}
		set
		{
			this["MFR_L_Money"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("False")]
	public bool MFR_L_SalesmanNo
	{
		get
		{
			return (bool)this["MFR_L_SalesmanNo"];
		}
		set
		{
			this["MFR_L_SalesmanNo"] = value;
		}
	}

	[DefaultSettingValue("False")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public bool MFR_L_SID
	{
		get
		{
			return (bool)this["MFR_L_SID"];
		}
		set
		{
			this["MFR_L_SID"] = value;
		}
	}

	[DefaultSettingValue("False")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool MFR_L_SubID
	{
		get
		{
			return (bool)this["MFR_L_SubID"];
		}
		set
		{
			this["MFR_L_SubID"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("False")]
	[UserScopedSetting]
	public bool MFR_L_Tax
	{
		get
		{
			return (bool)this["MFR_L_Tax"];
		}
		set
		{
			this["MFR_L_Tax"] = value;
		}
	}

	[UserScopedSetting]
	[DefaultSettingValue("False")]
	[DebuggerNonUserCode]
	public bool MFR_L_Text1
	{
		get
		{
			return (bool)this["MFR_L_Text1"];
		}
		set
		{
			this["MFR_L_Text1"] = value;
		}
	}

	[DefaultSettingValue("False")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public bool MFR_L_Text2
	{
		get
		{
			return (bool)this["MFR_L_Text2"];
		}
		set
		{
			this["MFR_L_Text2"] = value;
		}
	}

	[DefaultSettingValue("False")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public bool MFR_L_Text3
	{
		get
		{
			return (bool)this["MFR_L_Text3"];
		}
		set
		{
			this["MFR_L_Text3"] = value;
		}
	}

	[DefaultSettingValue("False")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool MFR_L_Text4
	{
		get
		{
			return (bool)this["MFR_L_Text4"];
		}
		set
		{
			this["MFR_L_Text4"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool MFR_L_Type
	{
		get
		{
			return (bool)this["MFR_L_Type"];
		}
		set
		{
			this["MFR_L_Type"] = value;
		}
	}

	[UserScopedSetting]
	[DefaultSettingValue("False")]
	[DebuggerNonUserCode]
	public bool MFR_L_TypeNo
	{
		get
		{
			return (bool)this["MFR_L_TypeNo"];
		}
		set
		{
			this["MFR_L_TypeNo"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool MFR_L_UnitName
	{
		get
		{
			return (bool)this["MFR_L_UnitName"];
		}
		set
		{
			this["MFR_L_UnitName"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("False")]
	public bool MFR_L_UnitNo
	{
		get
		{
			return (bool)this["MFR_L_UnitNo"];
		}
		set
		{
			this["MFR_L_UnitNo"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	[UserScopedSetting]
	public bool MFR_L_UnitPrice
	{
		get
		{
			return (bool)this["MFR_L_UnitPrice"];
		}
		set
		{
			this["MFR_L_UnitPrice"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool MFR_R_LastUpdate
	{
		get
		{
			return (bool)this["MFR_R_LastUpdate"];
		}
		set
		{
			this["MFR_R_LastUpdate"] = value;
		}
	}

	[DefaultSettingValue("False")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool MFR_R_StockTableNumber
	{
		get
		{
			return (bool)this["MFR_R_StockTableNumber"];
		}
		set
		{
			this["MFR_R_StockTableNumber"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool MFR_R_StockTable
	{
		get
		{
			return (bool)this["MFR_R_StockTable"];
		}
		set
		{
			this["MFR_R_StockTable"] = value;
		}
	}

	[DebuggerNonUserCode]
	[UserScopedSetting]
	[DefaultSettingValue("True")]
	public bool MFR_R_PLUNo
	{
		get
		{
			return (bool)this["MFR_R_PLUNo"];
		}
		set
		{
			this["MFR_R_PLUNo"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public bool MFR_R_PLUName
	{
		get
		{
			return (bool)this["MFR_R_PLUName"];
		}
		set
		{
			this["MFR_R_PLUName"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("False")]
	public bool MFR_R_UnitNo
	{
		get
		{
			return (bool)this["MFR_R_UnitNo"];
		}
		set
		{
			this["MFR_R_UnitNo"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool MFR_R_UnitName
	{
		get
		{
			return (bool)this["MFR_R_UnitName"];
		}
		set
		{
			this["MFR_R_UnitName"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	[UserScopedSetting]
	public bool MFR_R_Amount
	{
		get
		{
			return (bool)this["MFR_R_Amount"];
		}
		set
		{
			this["MFR_R_Amount"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	[UserScopedSetting]
	public bool MFR_R_LastStocktaking
	{
		get
		{
			return (bool)this["MFR_R_LastStocktaking"];
		}
		set
		{
			this["MFR_R_LastStocktaking"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("False")]
	[UserScopedSetting]
	public bool MFR_R_Spoilage
	{
		get
		{
			return (bool)this["MFR_R_Spoilage"];
		}
		set
		{
			this["MFR_R_Spoilage"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("False")]
	public bool MFR_R_SafetyStock
	{
		get
		{
			return (bool)this["MFR_R_SafetyStock"];
		}
		set
		{
			this["MFR_R_SafetyStock"] = value;
		}
	}

	[DefaultSettingValue("False")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public bool MFR_R_LowStock
	{
		get
		{
			return (bool)this["MFR_R_LowStock"];
		}
		set
		{
			this["MFR_R_LowStock"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("False")]
	[UserScopedSetting]
	public bool MFR_R_psAmount
	{
		get
		{
			return (bool)this["MFR_R_psAmount"];
		}
		set
		{
			this["MFR_R_psAmount"] = value;
		}
	}

	[DefaultSettingValue("False")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool MFR_R_psMoney
	{
		get
		{
			return (bool)this["MFR_R_psMoney"];
		}
		set
		{
			this["MFR_R_psMoney"] = value;
		}
	}

	[DefaultSettingValue("False")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool MFR_R_Order
	{
		get
		{
			return (bool)this["MFR_R_Order"];
		}
		set
		{
			this["MFR_R_Order"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public bool gen_OpenGuider
	{
		get
		{
			return (bool)this["gen_OpenGuider"];
		}
		set
		{
			this["gen_OpenGuider"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	[UserScopedSetting]
	public bool gen_DockingReport
	{
		get
		{
			return (bool)this["gen_DockingReport"];
		}
		set
		{
			this["gen_DockingReport"] = value;
		}
	}

	[DefaultSettingValue("3")]
	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	public int Report_DefaultWeight => (int)this["Report_DefaultWeight"];

	[DefaultSettingValue("True")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public bool Debuging_Release
	{
		get
		{
			return (bool)this["Debuging_Release"];
		}
		set
		{
			this["Debuging_Release"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool gen_AskLogs
	{
		get
		{
			return (bool)this["gen_AskLogs"];
		}
		set
		{
			this["gen_AskLogs"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("False")]
	public bool gen_AskPLU
	{
		get
		{
			return (bool)this["gen_AskPLU"];
		}
		set
		{
			this["gen_AskPLU"] = value;
		}
	}

	[UserScopedSetting]
	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	public bool gen_Ask
	{
		get
		{
			return (bool)this["gen_Ask"];
		}
		set
		{
			this["gen_Ask"] = value;
		}
	}

	[DefaultSettingValue("yyyy.MM.dd")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public string gen_dtType_Date
	{
		get
		{
			return (string)this["gen_dtType_Date"];
		}
		set
		{
			this["gen_dtType_Date"] = value;
		}
	}

	[DebuggerNonUserCode]
	[UserScopedSetting]
	[DefaultSettingValue("HH:mm:ss")]
	public string gen_dtType_Time
	{
		get
		{
			return (string)this["gen_dtType_Time"];
		}
		set
		{
			this["gen_dtType_Time"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("<<{0}>>")]
	[ApplicationScopedSetting]
	public string FXP_Offline => (string)this["FXP_Offline"];

	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("False")]
	public bool FXP_Logs_ECS => (bool)this["FXP_Logs_ECS"];

	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool FXP_Logs_Report => (bool)this["FXP_Logs_Report"];

	[DefaultSettingValue("False")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool gen_CloseTray
	{
		get
		{
			return (bool)this["gen_CloseTray"];
		}
		set
		{
			this["gen_CloseTray"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("16")]
	[ApplicationScopedSetting]
	public int gen_AskLogs_ExDevice => (int)this["gen_AskLogs_ExDevice"];

	[ApplicationScopedSetting]
	[DefaultSettingValue("30")]
	[DebuggerNonUserCode]
	public int gen_AskLogs_ExInterval => (int)this["gen_AskLogs_ExInterval"];

	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	[DefaultSettingValue("16")]
	public int gen_AskLogs_SameTime => (int)this["gen_AskLogs_SameTime"];

	[DebuggerNonUserCode]
	[DefaultSettingValue("2")]
	[ApplicationScopedSetting]
	public int gen_AskLogs_RefreshInterval => (int)this["gen_AskLogs_RefreshInterval"];

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool gen_AskLogs_HoldWhileOP
	{
		get
		{
			return (bool)this["gen_AskLogs_HoldWhileOP"];
		}
		set
		{
			this["gen_AskLogs_HoldWhileOP"] = value;
		}
	}

	[DefaultSettingValue("5")]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	public int gen_AskLogs_Hold => (int)this["gen_AskLogs_Hold"];

	[DefaultSettingValue("110")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public int stockExcel_Type
	{
		get
		{
			return (int)this["stockExcel_Type"];
		}
		set
		{
			this["stockExcel_Type"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("-1")]
	public int stockExcel_PLU
	{
		get
		{
			return (int)this["stockExcel_PLU"];
		}
		set
		{
			this["stockExcel_PLU"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("0")]
	[UserScopedSetting]
	public int stockExcel_Unit
	{
		get
		{
			return (int)this["stockExcel_Unit"];
		}
		set
		{
			this["stockExcel_Unit"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("-1")]
	public int stockExcel_Amount
	{
		get
		{
			return (int)this["stockExcel_Amount"];
		}
		set
		{
			this["stockExcel_Amount"] = value;
		}
	}

	[DefaultSettingValue("1")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public int stockExcel_UnitPrice
	{
		get
		{
			return (int)this["stockExcel_UnitPrice"];
		}
		set
		{
			this["stockExcel_UnitPrice"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("5")]
	[UserScopedSetting]
	public int stockExcel_TypeCol
	{
		get
		{
			return (int)this["stockExcel_TypeCol"];
		}
		set
		{
			this["stockExcel_TypeCol"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("1")]
	public int stockExcel_PLUCol
	{
		get
		{
			return (int)this["stockExcel_PLUCol"];
		}
		set
		{
			this["stockExcel_PLUCol"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("3")]
	public int stockExcel_UnitCol
	{
		get
		{
			return (int)this["stockExcel_UnitCol"];
		}
		set
		{
			this["stockExcel_UnitCol"] = value;
		}
	}

	[DefaultSettingValue("2")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public int stockExcel_AmountCol
	{
		get
		{
			return (int)this["stockExcel_AmountCol"];
		}
		set
		{
			this["stockExcel_AmountCol"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("4")]
	public int stockExcel_UnitPriceCol
	{
		get
		{
			return (int)this["stockExcel_UnitPriceCol"];
		}
		set
		{
			this["stockExcel_UnitPriceCol"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool MFR_L_Cost
	{
		get
		{
			return (bool)this["MFR_L_Cost"];
		}
		set
		{
			this["MFR_L_Cost"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool gen_AskLogs_OnlyIdle
	{
		get
		{
			return (bool)this["gen_AskLogs_OnlyIdle"];
		}
		set
		{
			this["gen_AskLogs_OnlyIdle"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public bool gen_CostFromDevice
	{
		get
		{
			return (bool)this["gen_CostFromDevice"];
		}
		set
		{
			this["gen_CostFromDevice"] = value;
		}
	}

	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool Enable_ImExport_Database => (bool)this["Enable_ImExport_Database"];

	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	[ApplicationScopedSetting]
	public bool Enable_ImExport_All => (bool)this["Enable_ImExport_All"];

	[DefaultSettingValue("True")]
	[DebuggerNonUserCode]
	[ApplicationScopedSetting]
	public bool Enable_AdvancedSetting => (bool)this["Enable_AdvancedSetting"];

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool Enable_PLU_AlphaSearch
	{
		get
		{
			return (bool)this["Enable_PLU_AlphaSearch"];
		}
		set
		{
			this["Enable_PLU_AlphaSearch"] = value;
		}
	}

	[DefaultSettingValue("False")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool Enable_PLU_MeasureWord
	{
		get
		{
			return (bool)this["Enable_PLU_MeasureWord"];
		}
		set
		{
			this["Enable_PLU_MeasureWord"] = value;
		}
	}

	[DefaultSettingValue("False")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public bool Enable_PLU_PercentTare
	{
		get
		{
			return (bool)this["Enable_PLU_PercentTare"];
		}
		set
		{
			this["Enable_PLU_PercentTare"] = value;
		}
	}

	[UserScopedSetting]
	[DefaultSettingValue("False")]
	[DebuggerNonUserCode]
	public bool Enable_PLU_FixedWeight
	{
		get
		{
			return (bool)this["Enable_PLU_FixedWeight"];
		}
		set
		{
			this["Enable_PLU_FixedWeight"] = value;
		}
	}

	[UserScopedSetting]
	[DefaultSettingValue("False")]
	[DebuggerNonUserCode]
	public bool Enable_PLU_Tax
	{
		get
		{
			return (bool)this["Enable_PLU_Tax"];
		}
		set
		{
			this["Enable_PLU_Tax"] = value;
		}
	}

	[DefaultSettingValue("False")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool Enable_PLU_Bill2
	{
		get
		{
			return (bool)this["Enable_PLU_Bill2"];
		}
		set
		{
			this["Enable_PLU_Bill2"] = value;
		}
	}

	[DefaultSettingValue("False")]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	public bool Enable_PLU_UselessSSP => (bool)this["Enable_PLU_UselessSSP"];

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("False")]
	public bool Enable_PLU_SpecialMode
	{
		get
		{
			return (bool)this["Enable_PLU_SpecialMode"];
		}
		set
		{
			this["Enable_PLU_SpecialMode"] = value;
		}
	}

	[DefaultSettingValue("")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public string Text_Payment1
	{
		get
		{
			return (string)this["Text_Payment1"];
		}
		set
		{
			this["Text_Payment1"] = value;
		}
	}

	[DebuggerNonUserCode]
	[UserScopedSetting]
	[DefaultSettingValue("")]
	public string Text_Payment2
	{
		get
		{
			return (string)this["Text_Payment2"];
		}
		set
		{
			this["Text_Payment2"] = value;
		}
	}

	[DefaultSettingValue("")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public string Text_Payment3
	{
		get
		{
			return (string)this["Text_Payment3"];
		}
		set
		{
			this["Text_Payment3"] = value;
		}
	}

	[DefaultSettingValue("")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public string PLUImportKeep
	{
		get
		{
			return (string)this["PLUImportKeep"];
		}
		set
		{
			this["PLUImportKeep"] = value;
		}
	}

	[DebuggerNonUserCode]
	[UserScopedSetting]
	[DefaultSettingValue("True")]
	public bool PLUImportAlphaAG
	{
		get
		{
			return (bool)this["PLUImportAlphaAG"];
		}
		set
		{
			this["PLUImportAlphaAG"] = value;
		}
	}

	[SpecialSetting(SpecialSetting.ConnectionString)]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("Provider=Microsoft.Jet.OLEDB.4.0;Data Source=|DataDirectory|\\Config\\_ECS.mdb;Persist Security Info=True")]
	public string _ECSConnectionString => (string)this["_ECSConnectionString"];

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("366")]
	public int gen_RDRD
	{
		get
		{
			return (int)this["gen_RDRD"];
		}
		set
		{
			this["gen_RDRD"] = value;
		}
	}

	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("Provider=Microsoft.Jet.OLEDB.4.0;Data Source=|DataDirectory|\\_Report.mdb")]
	[SpecialSetting(SpecialSetting.ConnectionString)]
	public string _ReportConnectionString => (string)this["_ReportConnectionString"];

	[UserScopedSetting]
	[DefaultSettingValue("1")]
	[DebuggerNonUserCode]
	public int excelfileDelay
	{
		get
		{
			return (int)this["excelfileDelay"];
		}
		set
		{
			this["excelfileDelay"] = value;
		}
	}

	[DebuggerNonUserCode]
	[UserScopedSetting]
	[DefaultSettingValue("1")]
	public int txtfileDelay
	{
		get
		{
			return (int)this["txtfileDelay"];
		}
		set
		{
			this["txtfileDelay"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public bool Enable_PLU_Discount
	{
		get
		{
			return (bool)this["Enable_PLU_Discount"];
		}
		set
		{
			this["Enable_PLU_Discount"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool Enable_PLU_Index
	{
		get
		{
			return (bool)this["Enable_PLU_Index"];
		}
		set
		{
			this["Enable_PLU_Index"] = value;
		}
	}

	[DebuggerNonUserCode]
	[UserScopedSetting]
	[DefaultSettingValue("True")]
	public bool Enable_PLU_ItemCode
	{
		get
		{
			return (bool)this["Enable_PLU_ItemCode"];
		}
		set
		{
			this["Enable_PLU_ItemCode"] = value;
		}
	}

	[DebuggerNonUserCode]
	[UserScopedSetting]
	[DefaultSettingValue("True")]
	public bool Enable_PLU_Class
	{
		get
		{
			return (bool)this["Enable_PLU_Class"];
		}
		set
		{
			this["Enable_PLU_Class"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool Enable_Bitmap
	{
		get
		{
			return (bool)this["Enable_Bitmap"];
		}
		set
		{
			this["Enable_Bitmap"] = value;
		}
	}

	[DefaultSettingValue("True")]
	[ApplicationScopedSetting]
	[DebuggerNonUserCode]
	public bool Visible_Bitmap => (bool)this["Visible_Bitmap"];

	[DefaultSettingValue("True")]
	[UserScopedSetting]
	[DebuggerNonUserCode]
	public bool Enable_PLU_Tare
	{
		get
		{
			return (bool)this["Enable_PLU_Tare"];
		}
		set
		{
			this["Enable_PLU_Tare"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	public bool Enable_PLU_Bitmap
	{
		get
		{
			return (bool)this["Enable_PLU_Bitmap"];
		}
		set
		{
			this["Enable_PLU_Bitmap"] = value;
		}
	}

	[DefaultSettingValue("False")]
	[DebuggerNonUserCode]
	[UserScopedSetting]
	public bool Enable_PLU_TimeSD
	{
		get
		{
			return (bool)this["Enable_PLU_TimeSD"];
		}
		set
		{
			this["Enable_PLU_TimeSD"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("False")]
	public bool Enable_PLU_TimeST
	{
		get
		{
			return (bool)this["Enable_PLU_TimeST"];
		}
		set
		{
			this["Enable_PLU_TimeST"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("False")]
	public bool Enable_PLU_TimePD
	{
		get
		{
			return (bool)this["Enable_PLU_TimePD"];
		}
		set
		{
			this["Enable_PLU_TimePD"] = value;
		}
	}

	[UserScopedSetting]
	[DebuggerNonUserCode]
	[DefaultSettingValue("False")]
	public bool Enable_PLU_TimePT
	{
		get
		{
			return (bool)this["Enable_PLU_TimePT"];
		}
		set
		{
			this["Enable_PLU_TimePT"] = value;
		}
	}

	[DebuggerNonUserCode]
	[DefaultSettingValue("True")]
	[UserScopedSetting]
	public bool Enable_PLU_TimeUD
	{
		get
		{
			return (bool)this["Enable_PLU_TimeUD"];
		}
		set
		{
			this["Enable_PLU_TimeUD"] = value;
		}
	}

	[ApplicationScopedSetting]
	[DefaultSettingValue("29")]
	[DebuggerNonUserCode]
	public int suggestUserLabelID => (int)this["suggestUserLabelID"];

	[UserScopedSetting]
	[DefaultSettingValue("99")]
	[DebuggerNonUserCode]
	public int maxUserLabelID
	{
		get
		{
			return (int)this["maxUserLabelID"];
		}
		set
		{
			this["maxUserLabelID"] = value;
		}
	}

	[DebuggerNonUserCode]
	[UserScopedSetting]
	[DefaultSettingValue("False")]
	public bool Enable_PLU_PcsSaveInWeight
	{
		get
		{
			return (bool)this["Enable_PLU_PcsSaveInWeight"];
		}
		set
		{
			this["Enable_PLU_PcsSaveInWeight"] = value;
		}
	}
}
