using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.Windows.Forms;
using ECS.Properties;

namespace ECS;

public class MenuParameterForm : Form
{
	private IContainer components;

	private Button fontButton;

	private GroupBox Font_GroupBox;

	private Button defaultFontButton;

	private GroupBox MenuEnable_GroupBox;

	private CheckBox custom4CheckBox;

	private CheckBox custom3CheckBox;

	private CheckBox custom2CheckBox;

	private CheckBox custom1CheckBox;

	private CheckBox vipCheckBox;

	private CheckBox wizardCheckBox;

	private CheckBox faceCheckBox;

	private CheckBox stringCheckBox;

	private CheckBox specCheckBox;

	private CheckBox labelCheckBox;

	private CheckBox pLUCheckBox;

	private CheckBox barcodeCheckBox;

	private CheckBox salesmanCheckBox;

	private CheckBox unitCheckBox;

	private CheckBox classCheckBox;

	private CheckBox deptCheckBox;

	private Button okButton;

	private Button cancelButton;

	private UIDataSet uiDataSet;

	private GroupBox general_GroupBox;

	private CheckBox multiStock_CheckBox;

	private CheckBox dockingEthernet_CheckBox;

	private CheckBox openGuider_CheckBox;

	private CheckBox dockingReport_CheckBox;

	private CheckBox askPLU_CheckBox;

	private CheckBox askLogs_CheckBox;

	private CheckBox ask_CheckBox;

	private GroupBox DateTime_GroupBox;

	private Panel panel2;

	private Panel panel1;

	private RadioButton DT_DDzMMzYY_RadioButton;

	private RadioButton DT_MMzDDzYY_RadioButton;

	private RadioButton DT_YYYYoMMoDD_RadioButton;

	private RadioButton DT_12H_RadioButton;

	private RadioButton DT_24H_RadioButton;

	private RadioButton DT_MM_DD_YY_RadioButton;

	private RadioButton DT_DD_MM_YY_RadioButton;

	private RadioButton DT_YYoMMoDD_RadioButton;

	private CheckBox CloseTray_CheckBox;

	private GroupBox SystemTray_GroupBox;

	private CheckBox TipOfTray_CheckBox;

	private CheckBox AlwaysTray_CheckBox;

	private CheckBox askLogs_OnlyIdle_CheckBox;

	private CheckBox costFromDevice_CheckBox;

	private TabControl Main_TabControl;

	private TabPage Common_TabPage;

	private TabPage Display_TabPage;

	private TabPage Enable_TabPage;

	private SplitContainer splitContainer1;

	private GroupBox PLUFucEnable_GroupBox;

	private CheckBox PLU_Measure_CheckBox;

	private CheckBox PLU_TarePercent_CheckBox;

	private CheckBox PLU_ALPHA_CheckBox;

	private CheckBox PLU_FixedWeight_CheckBox;

	private CheckBox PLU_Tax_CheckBox;

	private CheckBox PLU_Bill2_CheckBox;

	private CheckBox PLU_SpecialMode_CheckBox;

	private GroupBox Payments_GroupBox;

	private TextBox Payment3_TextBox;

	private TextBox Payment2_TextBox;

	private TextBox Payment1_TextBox;

	private CheckBox Payment3_CheckBox;

	private CheckBox Payment2_CheckBox;

	private CheckBox Payment1_CheckBox;

	private TabPage PLUImport_TabPage;

	private CheckBox PLUKeep_AutoDiscount_CheckBox;

	private CheckBox PLUKeep_ManualDiscount_CheckBox;

	private CheckBox PLUKeep_SType_CheckBox;

	private CheckBox PLUKeep_TimeST_CheckBox;

	private CheckBox PLUKeep_SSP1_CheckBox;

	private CheckBox PLUKeep_Text5_CheckBox;

	private CheckBox PLUKeep_MeasureWord_CheckBox;

	private CheckBox PLUKeep_Text1_CheckBox;

	private CheckBox PLUKeep_UnitID_CheckBox;

	private CheckBox PLUKeep_TimeUD_CheckBox;

	private CheckBox PLUKeep_SSP4_CheckBox;

	private CheckBox PLUKeep_TimeSD_CheckBox;

	private CheckBox PLUKeep_Tax_CheckBox;

	private CheckBox PLUKeep_Text4_CheckBox;

	private CheckBox PLUKeep_FixedWeight_CheckBox;

	private CheckBox PLUKeep_Bitmap_CheckBox;

	private CheckBox PLUKeep_Class_CheckBox;

	private CheckBox PLUKeep_TimePT_CheckBox;

	private CheckBox PLUKeep_SSP3_CheckBox;

	private CheckBox PLUKeep_Text7_CheckBox;

	private CheckBox PLUKeep_Cost_CheckBox;

	private CheckBox PLUKeep_Text3_CheckBox;

	private CheckBox PLUKeep_PercentTare_CheckBox;

	private CheckBox PLUKeep_Barcode2_CheckBox;

	private CheckBox PLUKeep_Index_CheckBox;

	private CheckBox PLUKeep_TimePD_CheckBox;

	private CheckBox PLUKeep_SSP2_CheckBox;

	private CheckBox PLUKeep_Text6_CheckBox;

	private CheckBox PLUKeep_Price_CheckBox;

	private CheckBox PLUKeep_Text2_CheckBox;

	private CheckBox PLUKeep_Tare_CheckBox;

	private CheckBox PLUKeep_Label2_CheckBox;

	private CheckBox PLUKeep_ItemCode_CheckBox;

	private CheckBox PLUKeep_Barcode1_CheckBox;

	private CheckBox PLUKeep_Label1_CheckBox;

	private CheckBox PLUFuc_AlphaAuto_CheckBox;

	private CheckBox PLUKeep_Name_CheckBox;

	private GroupBox Function_GroupBox;

	private GroupBox Keep_GroupBox;

	private Label Information_Label;

	private Label rdrd_Label;

	private NumericUpDown rdrd_NumericUpDown;

	private CheckBox reportdatabaseReducer_CheckBox;

	private Label rdd_Label;

	private NumericUpDown rdrd_d2_NumericUpDown;

	private CheckBox PLU_Discount_CheckBox;

	private CheckBox PLU_Index_CheckBox;

	private CheckBox PLU_Class_CheckBox;

	private CheckBox PLU_ItemCode_CheckBox;

	private CheckBox bitmapCheckBox;

	private CheckBox PLU_Tare_CheckBox;

	private CheckBox PLU_TimeST_CheckBox;

	private CheckBox PLU_TimeUD_CheckBox;

	private CheckBox PLU_TimePD_CheckBox;

	private CheckBox PLU_TimeSD_CheckBox;

	private CheckBox PLU_TimePT_CheckBox;

	private CheckBox PLU_Bitmap_CheckBox;

	private CheckBox PLU_SaveAsWeight_CheckBox;

	private CheckBox PLUKeep_SaveAsWeight_CheckBox;

	private Font ctfont;

	private UIDataSet.CustomRow custom1Row;

	private UIDataSet.CustomRow custom2Row;

	private UIDataSet.CustomRow custom3Row;

	private UIDataSet.CustomRow custom4Row;

	private CheckBox[] cb_PLUImportKeep;

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.MenuParameterForm));
		this.fontButton = new System.Windows.Forms.Button();
		this.Font_GroupBox = new System.Windows.Forms.GroupBox();
		this.defaultFontButton = new System.Windows.Forms.Button();
		this.MenuEnable_GroupBox = new System.Windows.Forms.GroupBox();
		this.bitmapCheckBox = new System.Windows.Forms.CheckBox();
		this.custom4CheckBox = new System.Windows.Forms.CheckBox();
		this.custom3CheckBox = new System.Windows.Forms.CheckBox();
		this.custom2CheckBox = new System.Windows.Forms.CheckBox();
		this.custom1CheckBox = new System.Windows.Forms.CheckBox();
		this.vipCheckBox = new System.Windows.Forms.CheckBox();
		this.labelCheckBox = new System.Windows.Forms.CheckBox();
		this.faceCheckBox = new System.Windows.Forms.CheckBox();
		this.wizardCheckBox = new System.Windows.Forms.CheckBox();
		this.stringCheckBox = new System.Windows.Forms.CheckBox();
		this.specCheckBox = new System.Windows.Forms.CheckBox();
		this.pLUCheckBox = new System.Windows.Forms.CheckBox();
		this.barcodeCheckBox = new System.Windows.Forms.CheckBox();
		this.salesmanCheckBox = new System.Windows.Forms.CheckBox();
		this.unitCheckBox = new System.Windows.Forms.CheckBox();
		this.classCheckBox = new System.Windows.Forms.CheckBox();
		this.deptCheckBox = new System.Windows.Forms.CheckBox();
		this.okButton = new System.Windows.Forms.Button();
		this.cancelButton = new System.Windows.Forms.Button();
		this.uiDataSet = new ECS.UIDataSet();
		this.general_GroupBox = new System.Windows.Forms.GroupBox();
		this.rdd_Label = new System.Windows.Forms.Label();
		this.rdrd_Label = new System.Windows.Forms.Label();
		this.rdrd_d2_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.rdrd_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.reportdatabaseReducer_CheckBox = new System.Windows.Forms.CheckBox();
		this.costFromDevice_CheckBox = new System.Windows.Forms.CheckBox();
		this.askPLU_CheckBox = new System.Windows.Forms.CheckBox();
		this.ask_CheckBox = new System.Windows.Forms.CheckBox();
		this.askLogs_OnlyIdle_CheckBox = new System.Windows.Forms.CheckBox();
		this.askLogs_CheckBox = new System.Windows.Forms.CheckBox();
		this.multiStock_CheckBox = new System.Windows.Forms.CheckBox();
		this.openGuider_CheckBox = new System.Windows.Forms.CheckBox();
		this.dockingReport_CheckBox = new System.Windows.Forms.CheckBox();
		this.dockingEthernet_CheckBox = new System.Windows.Forms.CheckBox();
		this.DateTime_GroupBox = new System.Windows.Forms.GroupBox();
		this.panel2 = new System.Windows.Forms.Panel();
		this.DT_12H_RadioButton = new System.Windows.Forms.RadioButton();
		this.DT_24H_RadioButton = new System.Windows.Forms.RadioButton();
		this.panel1 = new System.Windows.Forms.Panel();
		this.DT_DD_MM_YY_RadioButton = new System.Windows.Forms.RadioButton();
		this.DT_DDzMMzYY_RadioButton = new System.Windows.Forms.RadioButton();
		this.DT_MM_DD_YY_RadioButton = new System.Windows.Forms.RadioButton();
		this.DT_MMzDDzYY_RadioButton = new System.Windows.Forms.RadioButton();
		this.DT_YYoMMoDD_RadioButton = new System.Windows.Forms.RadioButton();
		this.DT_YYYYoMMoDD_RadioButton = new System.Windows.Forms.RadioButton();
		this.CloseTray_CheckBox = new System.Windows.Forms.CheckBox();
		this.SystemTray_GroupBox = new System.Windows.Forms.GroupBox();
		this.TipOfTray_CheckBox = new System.Windows.Forms.CheckBox();
		this.AlwaysTray_CheckBox = new System.Windows.Forms.CheckBox();
		this.Main_TabControl = new System.Windows.Forms.TabControl();
		this.Common_TabPage = new System.Windows.Forms.TabPage();
		this.Display_TabPage = new System.Windows.Forms.TabPage();
		this.Payments_GroupBox = new System.Windows.Forms.GroupBox();
		this.Payment3_TextBox = new System.Windows.Forms.TextBox();
		this.Payment2_TextBox = new System.Windows.Forms.TextBox();
		this.Payment1_TextBox = new System.Windows.Forms.TextBox();
		this.Payment3_CheckBox = new System.Windows.Forms.CheckBox();
		this.Payment2_CheckBox = new System.Windows.Forms.CheckBox();
		this.Payment1_CheckBox = new System.Windows.Forms.CheckBox();
		this.Enable_TabPage = new System.Windows.Forms.TabPage();
		this.PLUFucEnable_GroupBox = new System.Windows.Forms.GroupBox();
		this.PLU_TimeST_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLU_TimeUD_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLU_TimePD_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLU_TimeSD_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLU_TimePT_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLU_Bitmap_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLU_Index_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLU_Class_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLU_Discount_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLU_SpecialMode_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLU_Tax_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLU_ItemCode_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLU_Measure_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLU_Tare_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLU_TarePercent_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLU_ALPHA_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLU_Bill2_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLU_FixedWeight_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUImport_TabPage = new System.Windows.Forms.TabPage();
		this.Function_GroupBox = new System.Windows.Forms.GroupBox();
		this.PLUFuc_AlphaAuto_CheckBox = new System.Windows.Forms.CheckBox();
		this.Keep_GroupBox = new System.Windows.Forms.GroupBox();
		this.PLUKeep_Name_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_AutoDiscount_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_Label1_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_ManualDiscount_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_Barcode1_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_SType_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_ItemCode_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_TimeST_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_Label2_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_SSP1_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_Tare_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_Text5_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_Text2_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_MeasureWord_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_Price_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_Text1_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_Text6_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_UnitID_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_SSP2_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_TimeUD_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_TimePD_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_SSP4_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_Index_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_TimeSD_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_Barcode2_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_Tax_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_PercentTare_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_Text4_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_Text3_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_FixedWeight_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_Cost_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_Bitmap_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_Text7_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_Class_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_SSP3_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_TimePT_CheckBox = new System.Windows.Forms.CheckBox();
		this.splitContainer1 = new System.Windows.Forms.SplitContainer();
		this.Information_Label = new System.Windows.Forms.Label();
		this.PLU_SaveAsWeight_CheckBox = new System.Windows.Forms.CheckBox();
		this.PLUKeep_SaveAsWeight_CheckBox = new System.Windows.Forms.CheckBox();
		this.Font_GroupBox.SuspendLayout();
		this.MenuEnable_GroupBox.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).BeginInit();
		this.general_GroupBox.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.rdrd_d2_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.rdrd_NumericUpDown).BeginInit();
		this.DateTime_GroupBox.SuspendLayout();
		this.panel2.SuspendLayout();
		this.panel1.SuspendLayout();
		this.SystemTray_GroupBox.SuspendLayout();
		this.Main_TabControl.SuspendLayout();
		this.Common_TabPage.SuspendLayout();
		this.Display_TabPage.SuspendLayout();
		this.Payments_GroupBox.SuspendLayout();
		this.Enable_TabPage.SuspendLayout();
		this.PLUFucEnable_GroupBox.SuspendLayout();
		this.PLUImport_TabPage.SuspendLayout();
		this.Function_GroupBox.SuspendLayout();
		this.Keep_GroupBox.SuspendLayout();
		this.splitContainer1.Panel1.SuspendLayout();
		this.splitContainer1.Panel2.SuspendLayout();
		this.splitContainer1.SuspendLayout();
		base.SuspendLayout();
		resources.ApplyResources(this.fontButton, "fontButton");
		this.fontButton.Name = "fontButton";
		this.fontButton.UseVisualStyleBackColor = true;
		this.fontButton.Click += new System.EventHandler(fontButton_Click);
		this.Font_GroupBox.Controls.Add(this.defaultFontButton);
		this.Font_GroupBox.Controls.Add(this.fontButton);
		resources.ApplyResources(this.Font_GroupBox, "Font_GroupBox");
		this.Font_GroupBox.Name = "Font_GroupBox";
		this.Font_GroupBox.TabStop = false;
		resources.ApplyResources(this.defaultFontButton, "defaultFontButton");
		this.defaultFontButton.Name = "defaultFontButton";
		this.defaultFontButton.UseVisualStyleBackColor = true;
		this.defaultFontButton.Click += new System.EventHandler(defaultFontButton_Click);
		this.MenuEnable_GroupBox.Controls.Add(this.bitmapCheckBox);
		this.MenuEnable_GroupBox.Controls.Add(this.custom4CheckBox);
		this.MenuEnable_GroupBox.Controls.Add(this.custom3CheckBox);
		this.MenuEnable_GroupBox.Controls.Add(this.custom2CheckBox);
		this.MenuEnable_GroupBox.Controls.Add(this.custom1CheckBox);
		this.MenuEnable_GroupBox.Controls.Add(this.vipCheckBox);
		this.MenuEnable_GroupBox.Controls.Add(this.labelCheckBox);
		this.MenuEnable_GroupBox.Controls.Add(this.faceCheckBox);
		this.MenuEnable_GroupBox.Controls.Add(this.wizardCheckBox);
		this.MenuEnable_GroupBox.Controls.Add(this.stringCheckBox);
		this.MenuEnable_GroupBox.Controls.Add(this.specCheckBox);
		this.MenuEnable_GroupBox.Controls.Add(this.pLUCheckBox);
		this.MenuEnable_GroupBox.Controls.Add(this.barcodeCheckBox);
		this.MenuEnable_GroupBox.Controls.Add(this.salesmanCheckBox);
		this.MenuEnable_GroupBox.Controls.Add(this.unitCheckBox);
		this.MenuEnable_GroupBox.Controls.Add(this.classCheckBox);
		this.MenuEnable_GroupBox.Controls.Add(this.deptCheckBox);
		resources.ApplyResources(this.MenuEnable_GroupBox, "MenuEnable_GroupBox");
		this.MenuEnable_GroupBox.Name = "MenuEnable_GroupBox";
		this.MenuEnable_GroupBox.TabStop = false;
		resources.ApplyResources(this.bitmapCheckBox, "bitmapCheckBox");
		this.bitmapCheckBox.Name = "bitmapCheckBox";
		this.bitmapCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.custom4CheckBox, "custom4CheckBox");
		this.custom4CheckBox.Name = "custom4CheckBox";
		this.custom4CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.custom3CheckBox, "custom3CheckBox");
		this.custom3CheckBox.Name = "custom3CheckBox";
		this.custom3CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.custom2CheckBox, "custom2CheckBox");
		this.custom2CheckBox.Name = "custom2CheckBox";
		this.custom2CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.custom1CheckBox, "custom1CheckBox");
		this.custom1CheckBox.Name = "custom1CheckBox";
		this.custom1CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.vipCheckBox, "vipCheckBox");
		this.vipCheckBox.Name = "vipCheckBox";
		this.vipCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.labelCheckBox, "labelCheckBox");
		this.labelCheckBox.Name = "labelCheckBox";
		this.labelCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.faceCheckBox, "faceCheckBox");
		this.faceCheckBox.Name = "faceCheckBox";
		this.faceCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.wizardCheckBox, "wizardCheckBox");
		this.wizardCheckBox.Name = "wizardCheckBox";
		this.wizardCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.stringCheckBox, "stringCheckBox");
		this.stringCheckBox.Name = "stringCheckBox";
		this.stringCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.specCheckBox, "specCheckBox");
		this.specCheckBox.Name = "specCheckBox";
		this.specCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.pLUCheckBox, "pLUCheckBox");
		this.pLUCheckBox.Name = "pLUCheckBox";
		this.pLUCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.barcodeCheckBox, "barcodeCheckBox");
		this.barcodeCheckBox.Name = "barcodeCheckBox";
		this.barcodeCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.salesmanCheckBox, "salesmanCheckBox");
		this.salesmanCheckBox.Name = "salesmanCheckBox";
		this.salesmanCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.unitCheckBox, "unitCheckBox");
		this.unitCheckBox.Name = "unitCheckBox";
		this.unitCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.classCheckBox, "classCheckBox");
		this.classCheckBox.Name = "classCheckBox";
		this.classCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.deptCheckBox, "deptCheckBox");
		this.deptCheckBox.Name = "deptCheckBox";
		this.deptCheckBox.UseVisualStyleBackColor = true;
		this.okButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.okButton, "okButton");
		this.okButton.Name = "okButton";
		this.okButton.UseVisualStyleBackColor = true;
		this.okButton.Click += new System.EventHandler(okButton_Click);
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		resources.ApplyResources(this.cancelButton, "cancelButton");
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		this.uiDataSet.DataSetName = "UIDataSet";
		this.uiDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uiDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.general_GroupBox.Controls.Add(this.rdd_Label);
		this.general_GroupBox.Controls.Add(this.rdrd_Label);
		this.general_GroupBox.Controls.Add(this.rdrd_d2_NumericUpDown);
		this.general_GroupBox.Controls.Add(this.rdrd_NumericUpDown);
		this.general_GroupBox.Controls.Add(this.reportdatabaseReducer_CheckBox);
		this.general_GroupBox.Controls.Add(this.costFromDevice_CheckBox);
		this.general_GroupBox.Controls.Add(this.askPLU_CheckBox);
		this.general_GroupBox.Controls.Add(this.ask_CheckBox);
		this.general_GroupBox.Controls.Add(this.askLogs_OnlyIdle_CheckBox);
		this.general_GroupBox.Controls.Add(this.askLogs_CheckBox);
		this.general_GroupBox.Controls.Add(this.multiStock_CheckBox);
		this.general_GroupBox.Controls.Add(this.openGuider_CheckBox);
		this.general_GroupBox.Controls.Add(this.dockingReport_CheckBox);
		this.general_GroupBox.Controls.Add(this.dockingEthernet_CheckBox);
		resources.ApplyResources(this.general_GroupBox, "general_GroupBox");
		this.general_GroupBox.Name = "general_GroupBox";
		this.general_GroupBox.TabStop = false;
		resources.ApplyResources(this.rdd_Label, "rdd_Label");
		this.rdd_Label.Name = "rdd_Label";
		resources.ApplyResources(this.rdrd_Label, "rdrd_Label");
		this.rdrd_Label.Name = "rdrd_Label";
		resources.ApplyResources(this.rdrd_d2_NumericUpDown, "rdrd_d2_NumericUpDown");
		this.rdrd_d2_NumericUpDown.Maximum = new decimal(new int[4] { 999, 0, 0, 0 });
		this.rdrd_d2_NumericUpDown.Minimum = new decimal(new int[4] { 2, 0, 0, 0 });
		this.rdrd_d2_NumericUpDown.Name = "rdrd_d2_NumericUpDown";
		this.rdrd_d2_NumericUpDown.Value = new decimal(new int[4] { 3, 0, 0, 0 });
		resources.ApplyResources(this.rdrd_NumericUpDown, "rdrd_NumericUpDown");
		this.rdrd_NumericUpDown.Maximum = new decimal(new int[4] { 999, 0, 0, 0 });
		this.rdrd_NumericUpDown.Minimum = new decimal(new int[4] { 3, 0, 0, 0 });
		this.rdrd_NumericUpDown.Name = "rdrd_NumericUpDown";
		this.rdrd_NumericUpDown.Value = new decimal(new int[4] { 3, 0, 0, 0 });
		this.rdrd_NumericUpDown.ValueChanged += new System.EventHandler(rdrd_NumericUpDown_ValueChanged);
		resources.ApplyResources(this.reportdatabaseReducer_CheckBox, "reportdatabaseReducer_CheckBox");
		this.reportdatabaseReducer_CheckBox.Name = "reportdatabaseReducer_CheckBox";
		this.reportdatabaseReducer_CheckBox.UseVisualStyleBackColor = true;
		this.reportdatabaseReducer_CheckBox.Click += new System.EventHandler(reportdatabaseReducer_CheckBox_Click);
		resources.ApplyResources(this.costFromDevice_CheckBox, "costFromDevice_CheckBox");
		this.costFromDevice_CheckBox.Name = "costFromDevice_CheckBox";
		this.costFromDevice_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.askPLU_CheckBox, "askPLU_CheckBox");
		this.askPLU_CheckBox.Name = "askPLU_CheckBox";
		this.askPLU_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.ask_CheckBox, "ask_CheckBox");
		this.ask_CheckBox.Name = "ask_CheckBox";
		this.ask_CheckBox.UseVisualStyleBackColor = true;
		this.ask_CheckBox.CheckedChanged += new System.EventHandler(Ask_CheckBox_CheckedChanged);
		resources.ApplyResources(this.askLogs_OnlyIdle_CheckBox, "askLogs_OnlyIdle_CheckBox");
		this.askLogs_OnlyIdle_CheckBox.Name = "askLogs_OnlyIdle_CheckBox";
		this.askLogs_OnlyIdle_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.askLogs_CheckBox, "askLogs_CheckBox");
		this.askLogs_CheckBox.Name = "askLogs_CheckBox";
		this.askLogs_CheckBox.UseVisualStyleBackColor = true;
		this.askLogs_CheckBox.CheckedChanged += new System.EventHandler(Ask_CheckBox_CheckedChanged);
		resources.ApplyResources(this.multiStock_CheckBox, "multiStock_CheckBox");
		this.multiStock_CheckBox.Name = "multiStock_CheckBox";
		this.multiStock_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.openGuider_CheckBox, "openGuider_CheckBox");
		this.openGuider_CheckBox.Name = "openGuider_CheckBox";
		this.openGuider_CheckBox.UseVisualStyleBackColor = true;
		this.openGuider_CheckBox.CheckedChanged += new System.EventHandler(openGuider_CheckBox_CheckedChanged);
		resources.ApplyResources(this.dockingReport_CheckBox, "dockingReport_CheckBox");
		this.dockingReport_CheckBox.Name = "dockingReport_CheckBox";
		this.dockingReport_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.dockingEthernet_CheckBox, "dockingEthernet_CheckBox");
		this.dockingEthernet_CheckBox.Name = "dockingEthernet_CheckBox";
		this.dockingEthernet_CheckBox.UseVisualStyleBackColor = true;
		this.DateTime_GroupBox.Controls.Add(this.panel2);
		this.DateTime_GroupBox.Controls.Add(this.panel1);
		resources.ApplyResources(this.DateTime_GroupBox, "DateTime_GroupBox");
		this.DateTime_GroupBox.Name = "DateTime_GroupBox";
		this.DateTime_GroupBox.TabStop = false;
		this.panel2.Controls.Add(this.DT_12H_RadioButton);
		this.panel2.Controls.Add(this.DT_24H_RadioButton);
		resources.ApplyResources(this.panel2, "panel2");
		this.panel2.Name = "panel2";
		resources.ApplyResources(this.DT_12H_RadioButton, "DT_12H_RadioButton");
		this.DT_12H_RadioButton.Name = "DT_12H_RadioButton";
		this.DT_12H_RadioButton.TabStop = true;
		this.DT_12H_RadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.DT_24H_RadioButton, "DT_24H_RadioButton");
		this.DT_24H_RadioButton.Name = "DT_24H_RadioButton";
		this.DT_24H_RadioButton.TabStop = true;
		this.DT_24H_RadioButton.UseVisualStyleBackColor = true;
		this.panel1.Controls.Add(this.DT_DD_MM_YY_RadioButton);
		this.panel1.Controls.Add(this.DT_DDzMMzYY_RadioButton);
		this.panel1.Controls.Add(this.DT_MM_DD_YY_RadioButton);
		this.panel1.Controls.Add(this.DT_MMzDDzYY_RadioButton);
		this.panel1.Controls.Add(this.DT_YYoMMoDD_RadioButton);
		this.panel1.Controls.Add(this.DT_YYYYoMMoDD_RadioButton);
		resources.ApplyResources(this.panel1, "panel1");
		this.panel1.Name = "panel1";
		resources.ApplyResources(this.DT_DD_MM_YY_RadioButton, "DT_DD_MM_YY_RadioButton");
		this.DT_DD_MM_YY_RadioButton.Name = "DT_DD_MM_YY_RadioButton";
		this.DT_DD_MM_YY_RadioButton.TabStop = true;
		this.DT_DD_MM_YY_RadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.DT_DDzMMzYY_RadioButton, "DT_DDzMMzYY_RadioButton");
		this.DT_DDzMMzYY_RadioButton.Name = "DT_DDzMMzYY_RadioButton";
		this.DT_DDzMMzYY_RadioButton.TabStop = true;
		this.DT_DDzMMzYY_RadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.DT_MM_DD_YY_RadioButton, "DT_MM_DD_YY_RadioButton");
		this.DT_MM_DD_YY_RadioButton.Name = "DT_MM_DD_YY_RadioButton";
		this.DT_MM_DD_YY_RadioButton.TabStop = true;
		this.DT_MM_DD_YY_RadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.DT_MMzDDzYY_RadioButton, "DT_MMzDDzYY_RadioButton");
		this.DT_MMzDDzYY_RadioButton.Name = "DT_MMzDDzYY_RadioButton";
		this.DT_MMzDDzYY_RadioButton.TabStop = true;
		this.DT_MMzDDzYY_RadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.DT_YYoMMoDD_RadioButton, "DT_YYoMMoDD_RadioButton");
		this.DT_YYoMMoDD_RadioButton.Name = "DT_YYoMMoDD_RadioButton";
		this.DT_YYoMMoDD_RadioButton.TabStop = true;
		this.DT_YYoMMoDD_RadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.DT_YYYYoMMoDD_RadioButton, "DT_YYYYoMMoDD_RadioButton");
		this.DT_YYYYoMMoDD_RadioButton.Name = "DT_YYYYoMMoDD_RadioButton";
		this.DT_YYYYoMMoDD_RadioButton.TabStop = true;
		this.DT_YYYYoMMoDD_RadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.CloseTray_CheckBox, "CloseTray_CheckBox");
		this.CloseTray_CheckBox.Name = "CloseTray_CheckBox";
		this.CloseTray_CheckBox.UseVisualStyleBackColor = true;
		this.CloseTray_CheckBox.CheckedChanged += new System.EventHandler(Ask_CheckBox_CheckedChanged);
		this.SystemTray_GroupBox.Controls.Add(this.TipOfTray_CheckBox);
		this.SystemTray_GroupBox.Controls.Add(this.AlwaysTray_CheckBox);
		this.SystemTray_GroupBox.Controls.Add(this.CloseTray_CheckBox);
		resources.ApplyResources(this.SystemTray_GroupBox, "SystemTray_GroupBox");
		this.SystemTray_GroupBox.Name = "SystemTray_GroupBox";
		this.SystemTray_GroupBox.TabStop = false;
		resources.ApplyResources(this.TipOfTray_CheckBox, "TipOfTray_CheckBox");
		this.TipOfTray_CheckBox.Name = "TipOfTray_CheckBox";
		this.TipOfTray_CheckBox.UseVisualStyleBackColor = true;
		this.TipOfTray_CheckBox.CheckedChanged += new System.EventHandler(Ask_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AlwaysTray_CheckBox, "AlwaysTray_CheckBox");
		this.AlwaysTray_CheckBox.Name = "AlwaysTray_CheckBox";
		this.AlwaysTray_CheckBox.UseVisualStyleBackColor = true;
		this.AlwaysTray_CheckBox.CheckedChanged += new System.EventHandler(Ask_CheckBox_CheckedChanged);
		this.Main_TabControl.Controls.Add(this.Common_TabPage);
		this.Main_TabControl.Controls.Add(this.Display_TabPage);
		this.Main_TabControl.Controls.Add(this.Enable_TabPage);
		this.Main_TabControl.Controls.Add(this.PLUImport_TabPage);
		resources.ApplyResources(this.Main_TabControl, "Main_TabControl");
		this.Main_TabControl.Name = "Main_TabControl";
		this.Main_TabControl.SelectedIndex = 0;
		this.Main_TabControl.SelectedIndexChanged += new System.EventHandler(Main_TabControl_SelectedIndexChanged);
		this.Common_TabPage.Controls.Add(this.general_GroupBox);
		this.Common_TabPage.Controls.Add(this.SystemTray_GroupBox);
		resources.ApplyResources(this.Common_TabPage, "Common_TabPage");
		this.Common_TabPage.Name = "Common_TabPage";
		this.Common_TabPage.UseVisualStyleBackColor = true;
		this.Display_TabPage.Controls.Add(this.Payments_GroupBox);
		this.Display_TabPage.Controls.Add(this.Font_GroupBox);
		this.Display_TabPage.Controls.Add(this.DateTime_GroupBox);
		resources.ApplyResources(this.Display_TabPage, "Display_TabPage");
		this.Display_TabPage.Name = "Display_TabPage";
		this.Display_TabPage.UseVisualStyleBackColor = true;
		this.Payments_GroupBox.Controls.Add(this.Payment3_TextBox);
		this.Payments_GroupBox.Controls.Add(this.Payment2_TextBox);
		this.Payments_GroupBox.Controls.Add(this.Payment1_TextBox);
		this.Payments_GroupBox.Controls.Add(this.Payment3_CheckBox);
		this.Payments_GroupBox.Controls.Add(this.Payment2_CheckBox);
		this.Payments_GroupBox.Controls.Add(this.Payment1_CheckBox);
		resources.ApplyResources(this.Payments_GroupBox, "Payments_GroupBox");
		this.Payments_GroupBox.Name = "Payments_GroupBox";
		this.Payments_GroupBox.TabStop = false;
		resources.ApplyResources(this.Payment3_TextBox, "Payment3_TextBox");
		this.Payment3_TextBox.Name = "Payment3_TextBox";
		resources.ApplyResources(this.Payment2_TextBox, "Payment2_TextBox");
		this.Payment2_TextBox.Name = "Payment2_TextBox";
		resources.ApplyResources(this.Payment1_TextBox, "Payment1_TextBox");
		this.Payment1_TextBox.Name = "Payment1_TextBox";
		resources.ApplyResources(this.Payment3_CheckBox, "Payment3_CheckBox");
		this.Payment3_CheckBox.Name = "Payment3_CheckBox";
		this.Payment3_CheckBox.UseVisualStyleBackColor = true;
		this.Payment3_CheckBox.CheckedChanged += new System.EventHandler(Payment3_CheckBox_CheckedChanged);
		resources.ApplyResources(this.Payment2_CheckBox, "Payment2_CheckBox");
		this.Payment2_CheckBox.Name = "Payment2_CheckBox";
		this.Payment2_CheckBox.UseVisualStyleBackColor = true;
		this.Payment2_CheckBox.CheckedChanged += new System.EventHandler(Payment2_CheckBox_CheckedChanged);
		resources.ApplyResources(this.Payment1_CheckBox, "Payment1_CheckBox");
		this.Payment1_CheckBox.Name = "Payment1_CheckBox";
		this.Payment1_CheckBox.UseVisualStyleBackColor = true;
		this.Payment1_CheckBox.CheckedChanged += new System.EventHandler(Payment1_CheckBox_CheckedChanged);
		this.Enable_TabPage.Controls.Add(this.PLUFucEnable_GroupBox);
		this.Enable_TabPage.Controls.Add(this.MenuEnable_GroupBox);
		resources.ApplyResources(this.Enable_TabPage, "Enable_TabPage");
		this.Enable_TabPage.Name = "Enable_TabPage";
		this.Enable_TabPage.UseVisualStyleBackColor = true;
		this.PLUFucEnable_GroupBox.Controls.Add(this.PLU_TimeST_CheckBox);
		this.PLUFucEnable_GroupBox.Controls.Add(this.PLU_TimeUD_CheckBox);
		this.PLUFucEnable_GroupBox.Controls.Add(this.PLU_TimePD_CheckBox);
		this.PLUFucEnable_GroupBox.Controls.Add(this.PLU_TimeSD_CheckBox);
		this.PLUFucEnable_GroupBox.Controls.Add(this.PLU_TimePT_CheckBox);
		this.PLUFucEnable_GroupBox.Controls.Add(this.PLU_Bitmap_CheckBox);
		this.PLUFucEnable_GroupBox.Controls.Add(this.PLU_Index_CheckBox);
		this.PLUFucEnable_GroupBox.Controls.Add(this.PLU_Class_CheckBox);
		this.PLUFucEnable_GroupBox.Controls.Add(this.PLU_Discount_CheckBox);
		this.PLUFucEnable_GroupBox.Controls.Add(this.PLU_SpecialMode_CheckBox);
		this.PLUFucEnable_GroupBox.Controls.Add(this.PLU_Tax_CheckBox);
		this.PLUFucEnable_GroupBox.Controls.Add(this.PLU_ItemCode_CheckBox);
		this.PLUFucEnable_GroupBox.Controls.Add(this.PLU_SaveAsWeight_CheckBox);
		this.PLUFucEnable_GroupBox.Controls.Add(this.PLU_Measure_CheckBox);
		this.PLUFucEnable_GroupBox.Controls.Add(this.PLU_Tare_CheckBox);
		this.PLUFucEnable_GroupBox.Controls.Add(this.PLU_TarePercent_CheckBox);
		this.PLUFucEnable_GroupBox.Controls.Add(this.PLU_ALPHA_CheckBox);
		this.PLUFucEnable_GroupBox.Controls.Add(this.PLU_Bill2_CheckBox);
		this.PLUFucEnable_GroupBox.Controls.Add(this.PLU_FixedWeight_CheckBox);
		resources.ApplyResources(this.PLUFucEnable_GroupBox, "PLUFucEnable_GroupBox");
		this.PLUFucEnable_GroupBox.Name = "PLUFucEnable_GroupBox";
		this.PLUFucEnable_GroupBox.TabStop = false;
		resources.ApplyResources(this.PLU_TimeST_CheckBox, "PLU_TimeST_CheckBox");
		this.PLU_TimeST_CheckBox.Name = "PLU_TimeST_CheckBox";
		this.PLU_TimeST_CheckBox.UseVisualStyleBackColor = true;
		this.PLU_TimeST_CheckBox.CheckedChanged += new System.EventHandler(PLU_Fuc_CheckBox_CheckedChanged);
		resources.ApplyResources(this.PLU_TimeUD_CheckBox, "PLU_TimeUD_CheckBox");
		this.PLU_TimeUD_CheckBox.Name = "PLU_TimeUD_CheckBox";
		this.PLU_TimeUD_CheckBox.UseVisualStyleBackColor = true;
		this.PLU_TimeUD_CheckBox.CheckedChanged += new System.EventHandler(PLU_Fuc_CheckBox_CheckedChanged);
		resources.ApplyResources(this.PLU_TimePD_CheckBox, "PLU_TimePD_CheckBox");
		this.PLU_TimePD_CheckBox.Name = "PLU_TimePD_CheckBox";
		this.PLU_TimePD_CheckBox.UseVisualStyleBackColor = true;
		this.PLU_TimePD_CheckBox.CheckedChanged += new System.EventHandler(PLU_Fuc_CheckBox_CheckedChanged);
		resources.ApplyResources(this.PLU_TimeSD_CheckBox, "PLU_TimeSD_CheckBox");
		this.PLU_TimeSD_CheckBox.Name = "PLU_TimeSD_CheckBox";
		this.PLU_TimeSD_CheckBox.UseVisualStyleBackColor = true;
		this.PLU_TimeSD_CheckBox.CheckedChanged += new System.EventHandler(PLU_Fuc_CheckBox_CheckedChanged);
		resources.ApplyResources(this.PLU_TimePT_CheckBox, "PLU_TimePT_CheckBox");
		this.PLU_TimePT_CheckBox.Name = "PLU_TimePT_CheckBox";
		this.PLU_TimePT_CheckBox.UseVisualStyleBackColor = true;
		this.PLU_TimePT_CheckBox.CheckedChanged += new System.EventHandler(PLU_Fuc_CheckBox_CheckedChanged);
		resources.ApplyResources(this.PLU_Bitmap_CheckBox, "PLU_Bitmap_CheckBox");
		this.PLU_Bitmap_CheckBox.Name = "PLU_Bitmap_CheckBox";
		this.PLU_Bitmap_CheckBox.UseVisualStyleBackColor = true;
		this.PLU_Bitmap_CheckBox.CheckedChanged += new System.EventHandler(PLU_Fuc_CheckBox_CheckedChanged);
		resources.ApplyResources(this.PLU_Index_CheckBox, "PLU_Index_CheckBox");
		this.PLU_Index_CheckBox.Name = "PLU_Index_CheckBox";
		this.PLU_Index_CheckBox.UseVisualStyleBackColor = true;
		this.PLU_Index_CheckBox.CheckedChanged += new System.EventHandler(PLU_Fuc_CheckBox_CheckedChanged);
		resources.ApplyResources(this.PLU_Class_CheckBox, "PLU_Class_CheckBox");
		this.PLU_Class_CheckBox.Name = "PLU_Class_CheckBox";
		this.PLU_Class_CheckBox.UseVisualStyleBackColor = true;
		this.PLU_Class_CheckBox.CheckedChanged += new System.EventHandler(PLU_Fuc_CheckBox_CheckedChanged);
		resources.ApplyResources(this.PLU_Discount_CheckBox, "PLU_Discount_CheckBox");
		this.PLU_Discount_CheckBox.Name = "PLU_Discount_CheckBox";
		this.PLU_Discount_CheckBox.UseVisualStyleBackColor = true;
		this.PLU_Discount_CheckBox.CheckedChanged += new System.EventHandler(PLU_Fuc_CheckBox_CheckedChanged);
		resources.ApplyResources(this.PLU_SpecialMode_CheckBox, "PLU_SpecialMode_CheckBox");
		this.PLU_SpecialMode_CheckBox.Name = "PLU_SpecialMode_CheckBox";
		this.PLU_SpecialMode_CheckBox.UseVisualStyleBackColor = true;
		this.PLU_SpecialMode_CheckBox.CheckedChanged += new System.EventHandler(PLU_Fuc_CheckBox_CheckedChanged);
		resources.ApplyResources(this.PLU_Tax_CheckBox, "PLU_Tax_CheckBox");
		this.PLU_Tax_CheckBox.Name = "PLU_Tax_CheckBox";
		this.PLU_Tax_CheckBox.UseVisualStyleBackColor = true;
		this.PLU_Tax_CheckBox.CheckedChanged += new System.EventHandler(PLU_Fuc_CheckBox_CheckedChanged);
		resources.ApplyResources(this.PLU_ItemCode_CheckBox, "PLU_ItemCode_CheckBox");
		this.PLU_ItemCode_CheckBox.Name = "PLU_ItemCode_CheckBox";
		this.PLU_ItemCode_CheckBox.UseVisualStyleBackColor = true;
		this.PLU_ItemCode_CheckBox.CheckedChanged += new System.EventHandler(PLU_Fuc_CheckBox_CheckedChanged);
		resources.ApplyResources(this.PLU_Measure_CheckBox, "PLU_Measure_CheckBox");
		this.PLU_Measure_CheckBox.Name = "PLU_Measure_CheckBox";
		this.PLU_Measure_CheckBox.UseVisualStyleBackColor = true;
		this.PLU_Measure_CheckBox.CheckedChanged += new System.EventHandler(PLU_Fuc_CheckBox_CheckedChanged);
		resources.ApplyResources(this.PLU_Tare_CheckBox, "PLU_Tare_CheckBox");
		this.PLU_Tare_CheckBox.Name = "PLU_Tare_CheckBox";
		this.PLU_Tare_CheckBox.UseVisualStyleBackColor = true;
		this.PLU_Tare_CheckBox.CheckedChanged += new System.EventHandler(PLU_Fuc_CheckBox_CheckedChanged);
		resources.ApplyResources(this.PLU_TarePercent_CheckBox, "PLU_TarePercent_CheckBox");
		this.PLU_TarePercent_CheckBox.Name = "PLU_TarePercent_CheckBox";
		this.PLU_TarePercent_CheckBox.UseVisualStyleBackColor = true;
		this.PLU_TarePercent_CheckBox.CheckedChanged += new System.EventHandler(PLU_Fuc_CheckBox_CheckedChanged);
		resources.ApplyResources(this.PLU_ALPHA_CheckBox, "PLU_ALPHA_CheckBox");
		this.PLU_ALPHA_CheckBox.Name = "PLU_ALPHA_CheckBox";
		this.PLU_ALPHA_CheckBox.UseVisualStyleBackColor = true;
		this.PLU_ALPHA_CheckBox.CheckedChanged += new System.EventHandler(PLU_Fuc_CheckBox_CheckedChanged);
		this.PLU_ALPHA_CheckBox.Click += new System.EventHandler(PLU_ALPHA_CheckBox_Click);
		resources.ApplyResources(this.PLU_Bill2_CheckBox, "PLU_Bill2_CheckBox");
		this.PLU_Bill2_CheckBox.Name = "PLU_Bill2_CheckBox";
		this.PLU_Bill2_CheckBox.UseVisualStyleBackColor = true;
		this.PLU_Bill2_CheckBox.CheckedChanged += new System.EventHandler(PLU_Fuc_CheckBox_CheckedChanged);
		resources.ApplyResources(this.PLU_FixedWeight_CheckBox, "PLU_FixedWeight_CheckBox");
		this.PLU_FixedWeight_CheckBox.Name = "PLU_FixedWeight_CheckBox";
		this.PLU_FixedWeight_CheckBox.UseVisualStyleBackColor = true;
		this.PLU_FixedWeight_CheckBox.CheckedChanged += new System.EventHandler(PLU_Fuc_CheckBox_CheckedChanged);
		this.PLUImport_TabPage.Controls.Add(this.Function_GroupBox);
		this.PLUImport_TabPage.Controls.Add(this.Keep_GroupBox);
		resources.ApplyResources(this.PLUImport_TabPage, "PLUImport_TabPage");
		this.PLUImport_TabPage.Name = "PLUImport_TabPage";
		this.PLUImport_TabPage.UseVisualStyleBackColor = true;
		this.Function_GroupBox.Controls.Add(this.PLUFuc_AlphaAuto_CheckBox);
		resources.ApplyResources(this.Function_GroupBox, "Function_GroupBox");
		this.Function_GroupBox.Name = "Function_GroupBox";
		this.Function_GroupBox.TabStop = false;
		resources.ApplyResources(this.PLUFuc_AlphaAuto_CheckBox, "PLUFuc_AlphaAuto_CheckBox");
		this.PLUFuc_AlphaAuto_CheckBox.Name = "PLUFuc_AlphaAuto_CheckBox";
		this.PLUFuc_AlphaAuto_CheckBox.UseVisualStyleBackColor = true;
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_Name_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_AutoDiscount_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_Label1_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_ManualDiscount_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_Barcode1_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_SType_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_ItemCode_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_TimeST_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_Label2_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_SSP1_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_Tare_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_Text5_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_Text2_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_SaveAsWeight_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_MeasureWord_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_Price_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_Text1_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_Text6_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_UnitID_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_SSP2_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_TimeUD_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_TimePD_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_SSP4_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_Index_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_TimeSD_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_Barcode2_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_Tax_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_PercentTare_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_Text4_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_Text3_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_FixedWeight_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_Cost_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_Bitmap_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_Text7_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_Class_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_SSP3_CheckBox);
		this.Keep_GroupBox.Controls.Add(this.PLUKeep_TimePT_CheckBox);
		resources.ApplyResources(this.Keep_GroupBox, "Keep_GroupBox");
		this.Keep_GroupBox.Name = "Keep_GroupBox";
		this.Keep_GroupBox.TabStop = false;
		resources.ApplyResources(this.PLUKeep_Name_CheckBox, "PLUKeep_Name_CheckBox");
		this.PLUKeep_Name_CheckBox.Name = "PLUKeep_Name_CheckBox";
		this.PLUKeep_Name_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_AutoDiscount_CheckBox, "PLUKeep_AutoDiscount_CheckBox");
		this.PLUKeep_AutoDiscount_CheckBox.Name = "PLUKeep_AutoDiscount_CheckBox";
		this.PLUKeep_AutoDiscount_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_Label1_CheckBox, "PLUKeep_Label1_CheckBox");
		this.PLUKeep_Label1_CheckBox.Name = "PLUKeep_Label1_CheckBox";
		this.PLUKeep_Label1_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_ManualDiscount_CheckBox, "PLUKeep_ManualDiscount_CheckBox");
		this.PLUKeep_ManualDiscount_CheckBox.Name = "PLUKeep_ManualDiscount_CheckBox";
		this.PLUKeep_ManualDiscount_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_Barcode1_CheckBox, "PLUKeep_Barcode1_CheckBox");
		this.PLUKeep_Barcode1_CheckBox.Name = "PLUKeep_Barcode1_CheckBox";
		this.PLUKeep_Barcode1_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_SType_CheckBox, "PLUKeep_SType_CheckBox");
		this.PLUKeep_SType_CheckBox.Name = "PLUKeep_SType_CheckBox";
		this.PLUKeep_SType_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_ItemCode_CheckBox, "PLUKeep_ItemCode_CheckBox");
		this.PLUKeep_ItemCode_CheckBox.Name = "PLUKeep_ItemCode_CheckBox";
		this.PLUKeep_ItemCode_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_TimeST_CheckBox, "PLUKeep_TimeST_CheckBox");
		this.PLUKeep_TimeST_CheckBox.Name = "PLUKeep_TimeST_CheckBox";
		this.PLUKeep_TimeST_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_Label2_CheckBox, "PLUKeep_Label2_CheckBox");
		this.PLUKeep_Label2_CheckBox.Name = "PLUKeep_Label2_CheckBox";
		this.PLUKeep_Label2_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_SSP1_CheckBox, "PLUKeep_SSP1_CheckBox");
		this.PLUKeep_SSP1_CheckBox.Name = "PLUKeep_SSP1_CheckBox";
		this.PLUKeep_SSP1_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_Tare_CheckBox, "PLUKeep_Tare_CheckBox");
		this.PLUKeep_Tare_CheckBox.Name = "PLUKeep_Tare_CheckBox";
		this.PLUKeep_Tare_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_Text5_CheckBox, "PLUKeep_Text5_CheckBox");
		this.PLUKeep_Text5_CheckBox.Name = "PLUKeep_Text5_CheckBox";
		this.PLUKeep_Text5_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_Text2_CheckBox, "PLUKeep_Text2_CheckBox");
		this.PLUKeep_Text2_CheckBox.Name = "PLUKeep_Text2_CheckBox";
		this.PLUKeep_Text2_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_MeasureWord_CheckBox, "PLUKeep_MeasureWord_CheckBox");
		this.PLUKeep_MeasureWord_CheckBox.Name = "PLUKeep_MeasureWord_CheckBox";
		this.PLUKeep_MeasureWord_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_Price_CheckBox, "PLUKeep_Price_CheckBox");
		this.PLUKeep_Price_CheckBox.Name = "PLUKeep_Price_CheckBox";
		this.PLUKeep_Price_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_Text1_CheckBox, "PLUKeep_Text1_CheckBox");
		this.PLUKeep_Text1_CheckBox.Name = "PLUKeep_Text1_CheckBox";
		this.PLUKeep_Text1_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_Text6_CheckBox, "PLUKeep_Text6_CheckBox");
		this.PLUKeep_Text6_CheckBox.Name = "PLUKeep_Text6_CheckBox";
		this.PLUKeep_Text6_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_UnitID_CheckBox, "PLUKeep_UnitID_CheckBox");
		this.PLUKeep_UnitID_CheckBox.Name = "PLUKeep_UnitID_CheckBox";
		this.PLUKeep_UnitID_CheckBox.UseVisualStyleBackColor = true;
		this.PLUKeep_UnitID_CheckBox.CheckedChanged += new System.EventHandler(PLUKeep_UnitID_CheckBox_CheckedChanged);
		resources.ApplyResources(this.PLUKeep_SSP2_CheckBox, "PLUKeep_SSP2_CheckBox");
		this.PLUKeep_SSP2_CheckBox.Name = "PLUKeep_SSP2_CheckBox";
		this.PLUKeep_SSP2_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_TimeUD_CheckBox, "PLUKeep_TimeUD_CheckBox");
		this.PLUKeep_TimeUD_CheckBox.Name = "PLUKeep_TimeUD_CheckBox";
		this.PLUKeep_TimeUD_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_TimePD_CheckBox, "PLUKeep_TimePD_CheckBox");
		this.PLUKeep_TimePD_CheckBox.Name = "PLUKeep_TimePD_CheckBox";
		this.PLUKeep_TimePD_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_SSP4_CheckBox, "PLUKeep_SSP4_CheckBox");
		this.PLUKeep_SSP4_CheckBox.Name = "PLUKeep_SSP4_CheckBox";
		this.PLUKeep_SSP4_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_Index_CheckBox, "PLUKeep_Index_CheckBox");
		this.PLUKeep_Index_CheckBox.Name = "PLUKeep_Index_CheckBox";
		this.PLUKeep_Index_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_TimeSD_CheckBox, "PLUKeep_TimeSD_CheckBox");
		this.PLUKeep_TimeSD_CheckBox.Name = "PLUKeep_TimeSD_CheckBox";
		this.PLUKeep_TimeSD_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_Barcode2_CheckBox, "PLUKeep_Barcode2_CheckBox");
		this.PLUKeep_Barcode2_CheckBox.Name = "PLUKeep_Barcode2_CheckBox";
		this.PLUKeep_Barcode2_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_Tax_CheckBox, "PLUKeep_Tax_CheckBox");
		this.PLUKeep_Tax_CheckBox.Name = "PLUKeep_Tax_CheckBox";
		this.PLUKeep_Tax_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_PercentTare_CheckBox, "PLUKeep_PercentTare_CheckBox");
		this.PLUKeep_PercentTare_CheckBox.Name = "PLUKeep_PercentTare_CheckBox";
		this.PLUKeep_PercentTare_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_Text4_CheckBox, "PLUKeep_Text4_CheckBox");
		this.PLUKeep_Text4_CheckBox.Name = "PLUKeep_Text4_CheckBox";
		this.PLUKeep_Text4_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_Text3_CheckBox, "PLUKeep_Text3_CheckBox");
		this.PLUKeep_Text3_CheckBox.Name = "PLUKeep_Text3_CheckBox";
		this.PLUKeep_Text3_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_FixedWeight_CheckBox, "PLUKeep_FixedWeight_CheckBox");
		this.PLUKeep_FixedWeight_CheckBox.Name = "PLUKeep_FixedWeight_CheckBox";
		this.PLUKeep_FixedWeight_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_Cost_CheckBox, "PLUKeep_Cost_CheckBox");
		this.PLUKeep_Cost_CheckBox.Name = "PLUKeep_Cost_CheckBox";
		this.PLUKeep_Cost_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_Bitmap_CheckBox, "PLUKeep_Bitmap_CheckBox");
		this.PLUKeep_Bitmap_CheckBox.Name = "PLUKeep_Bitmap_CheckBox";
		this.PLUKeep_Bitmap_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_Text7_CheckBox, "PLUKeep_Text7_CheckBox");
		this.PLUKeep_Text7_CheckBox.Name = "PLUKeep_Text7_CheckBox";
		this.PLUKeep_Text7_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_Class_CheckBox, "PLUKeep_Class_CheckBox");
		this.PLUKeep_Class_CheckBox.Name = "PLUKeep_Class_CheckBox";
		this.PLUKeep_Class_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_SSP3_CheckBox, "PLUKeep_SSP3_CheckBox");
		this.PLUKeep_SSP3_CheckBox.Name = "PLUKeep_SSP3_CheckBox";
		this.PLUKeep_SSP3_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PLUKeep_TimePT_CheckBox, "PLUKeep_TimePT_CheckBox");
		this.PLUKeep_TimePT_CheckBox.Name = "PLUKeep_TimePT_CheckBox";
		this.PLUKeep_TimePT_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.splitContainer1, "splitContainer1");
		this.splitContainer1.Name = "splitContainer1";
		this.splitContainer1.Panel1.Controls.Add(this.Main_TabControl);
		this.splitContainer1.Panel2.Controls.Add(this.Information_Label);
		this.splitContainer1.Panel2.Controls.Add(this.cancelButton);
		this.splitContainer1.Panel2.Controls.Add(this.okButton);
		resources.ApplyResources(this.Information_Label, "Information_Label");
		this.Information_Label.ForeColor = System.Drawing.Color.Red;
		this.Information_Label.Name = "Information_Label";
		resources.ApplyResources(this.PLU_SaveAsWeight_CheckBox, "PLU_SaveAsWeight_CheckBox");
		this.PLU_SaveAsWeight_CheckBox.Name = "PLU_SaveAsWeight_CheckBox";
		this.PLU_SaveAsWeight_CheckBox.UseVisualStyleBackColor = true;
		this.PLU_SaveAsWeight_CheckBox.CheckedChanged += new System.EventHandler(PLU_Fuc_CheckBox_CheckedChanged);
		resources.ApplyResources(this.PLUKeep_SaveAsWeight_CheckBox, "PLUKeep_SaveAsWeight_CheckBox");
		this.PLUKeep_SaveAsWeight_CheckBox.Name = "PLUKeep_SaveAsWeight_CheckBox";
		this.PLUKeep_SaveAsWeight_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.splitContainer1);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		base.Name = "MenuParameterForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(MenuParameterForm_Load);
		this.Font_GroupBox.ResumeLayout(false);
		this.MenuEnable_GroupBox.ResumeLayout(false);
		this.MenuEnable_GroupBox.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).EndInit();
		this.general_GroupBox.ResumeLayout(false);
		this.general_GroupBox.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.rdrd_d2_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.rdrd_NumericUpDown).EndInit();
		this.DateTime_GroupBox.ResumeLayout(false);
		this.panel2.ResumeLayout(false);
		this.panel2.PerformLayout();
		this.panel1.ResumeLayout(false);
		this.panel1.PerformLayout();
		this.SystemTray_GroupBox.ResumeLayout(false);
		this.SystemTray_GroupBox.PerformLayout();
		this.Main_TabControl.ResumeLayout(false);
		this.Common_TabPage.ResumeLayout(false);
		this.Display_TabPage.ResumeLayout(false);
		this.Payments_GroupBox.ResumeLayout(false);
		this.Payments_GroupBox.PerformLayout();
		this.Enable_TabPage.ResumeLayout(false);
		this.PLUFucEnable_GroupBox.ResumeLayout(false);
		this.PLUFucEnable_GroupBox.PerformLayout();
		this.PLUImport_TabPage.ResumeLayout(false);
		this.Function_GroupBox.ResumeLayout(false);
		this.Function_GroupBox.PerformLayout();
		this.Keep_GroupBox.ResumeLayout(false);
		this.Keep_GroupBox.PerformLayout();
		this.splitContainer1.Panel1.ResumeLayout(false);
		this.splitContainer1.Panel2.ResumeLayout(false);
		this.splitContainer1.Panel2.PerformLayout();
		this.splitContainer1.ResumeLayout(false);
		base.ResumeLayout(false);
	}

	public MenuParameterForm()
	{
		InitializeComponent();
	}

	private void FindCustom()
	{
		string fileName = Application.StartupPath + "\\Custom.xml";
		uiDataSet.Custom.ReadXml(fileName);
		DataRow[] array = uiDataSet.Custom.Select("[Table] = 'Custom1'");
		if (array.Length > 0)
		{
			custom1Row = array[0] as UIDataSet.CustomRow;
		}
		array = uiDataSet.Custom.Select("[Table] = 'Custom2'");
		if (array.Length > 0)
		{
			custom2Row = array[0] as UIDataSet.CustomRow;
		}
		array = uiDataSet.Custom.Select("[Table] = 'Custom3'");
		if (array.Length > 0)
		{
			custom3Row = array[0] as UIDataSet.CustomRow;
		}
		array = uiDataSet.Custom.Select("[Table] = 'Custom4'");
		if (array.Length > 0)
		{
			custom4Row = array[0] as UIDataSet.CustomRow;
		}
	}

	private void LangSocket_Ramuza()
	{
		CheckBox checkBox = multiStock_CheckBox;
		CheckBox checkBox2 = costFromDevice_CheckBox;
		GroupBox payments_GroupBox = Payments_GroupBox;
		CheckBox checkBox3 = vipCheckBox;
		CheckBox pLU_ALPHA_CheckBox = PLU_ALPHA_CheckBox;
		CheckBox pLU_Measure_CheckBox = PLU_Measure_CheckBox;
		CheckBox pLU_SaveAsWeight_CheckBox = PLU_SaveAsWeight_CheckBox;
		bool flag = (PLU_Tax_CheckBox.Visible = false);
		bool flag3 = (pLU_SaveAsWeight_CheckBox.Visible = flag);
		bool flag5 = (pLU_Measure_CheckBox.Visible = flag3);
		bool flag7 = (pLU_ALPHA_CheckBox.Visible = flag5);
		bool flag9 = (checkBox3.Visible = flag7);
		bool flag11 = (payments_GroupBox.Visible = flag9);
		bool visible = (checkBox2.Visible = flag11);
		checkBox.Visible = visible;
		PLUKeep_AutoDiscount_CheckBox.Text = "Desconto";
		PLUKeep_Text6_CheckBox.Text = "Lot";
		PLUKeep_Text6_CheckBox.Bounds = PLUKeep_ManualDiscount_CheckBox.Bounds;
		PLUKeep_ManualDiscount_CheckBox.Visible = false;
	}

	private void MenuParameterForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_AdvancedSetting");
		SystemTray_GroupBox.Text = Program.GetLang("pw_SystemTrayIcon");
		CloseTray_CheckBox.Text = Program.GetLang("pw_HideToSystemTrayWhenClose");
		AlwaysTray_CheckBox.Text = Program.GetLang("pw_AlwaysShowSystemTrayIcon");
		TipOfTray_CheckBox.Text = Program.GetLang("pw_ShowTipsOnSystemTrayIcon");
		ask_CheckBox.Text = Program.GetLang("pw_Realtimesynchronization");
		askLogs_CheckBox.Text = Program.GetLang("pw_Logs");
		askPLU_CheckBox.Text = Program.GetLang("pw_PLU");
		askLogs_OnlyIdle_CheckBox.Text = Program.GetLang("pw_OnlyInIdle");
		costFromDevice_CheckBox.Text = Program.GetLang("pw_CostFromDevice_____");
		openGuider_CheckBox.Text = Program.GetLang("pw_OpenGuider");
		general_GroupBox.Text = Program.GetLang("pw_GeneralSetting");
		DateTime_GroupBox.Text = Program.GetLang("pw_DateTime");
		cancelButton.Text = Program.GetLang("pw_Cancel");
		defaultFontButton.Text = Program.GetLang("pw_SystemDefault");
		Font_GroupBox.Text = Program.GetLang("pw_Font");
		fontButton.Text = Program.GetLang("pw_Choose");
		MenuEnable_GroupBox.Text = Program.GetLang("pw_MenuEnable");
		okButton.Text = Program.GetLang("pw_OK");
		multiStock_CheckBox.Text = Program.GetLang("pw_MultiStock");
		dockingEthernet_CheckBox.Text = Program.GetLang("pw_AlwaysDockEthernet");
		dockingReport_CheckBox.Text = Program.GetLang("pw_AlwaysDockReport");
		PLUImport_TabPage.Text = Program.GetLang("pw_PLUImport");
		Keep_GroupBox.Text = Program.GetLang("pw_KeepSegement");
		Function_GroupBox.Text = Program.GetLang("pw_Function");
		PLUFuc_AlphaAuto_CheckBox.Text = Program.GetLang("pw_AlphaAutoGenerate");
		PLUKeep_AutoDiscount_CheckBox.Text = Program.GetLang("pw_AutoDiscount");
		PLUKeep_Barcode1_CheckBox.Text = Program.GetLang("pw_Bill1") + "-" + Program.GetLang("pw_Barcode");
		PLUKeep_Barcode2_CheckBox.Text = Program.GetLang("pw_Bill2") + "-" + Program.GetLang("pw_Barcode");
		CheckBox pLU_Bitmap_CheckBox = PLU_Bitmap_CheckBox;
		string text = (PLUKeep_Bitmap_CheckBox.Text = Program.GetLang("pw_Bitmap"));
		pLU_Bitmap_CheckBox.Text = text;
		PLUKeep_Class_CheckBox.Text = Program.GetLang("pw_AffiliatedClass");
		PLUKeep_Cost_CheckBox.Text = Program.GetLang("pw_Cost");
		PLUKeep_FixedWeight_CheckBox.Text = Program.GetLang("pw_FixedWeight");
		PLUKeep_MeasureWord_CheckBox.Text = Program.GetLang("pw_MeasureWord");
		PLUKeep_SaveAsWeight_CheckBox.Text = Program.GetLang("pw_SaveAsWeight");
		PLUKeep_Index_CheckBox.Text = Program.GetLang("pw_IndexBarcode");
		PLUKeep_ItemCode_CheckBox.Text = Program.GetLang("pw_ItemCode");
		PLUKeep_Label1_CheckBox.Text = Program.GetLang("pw_Bill1") + "-" + Program.GetLang("pw_PrintFormat");
		PLUKeep_Label2_CheckBox.Text = Program.GetLang("pw_Bill2") + "-" + Program.GetLang("pw_PrintFormat");
		PLUKeep_ManualDiscount_CheckBox.Text = Program.GetLang("pw_ManualDiscount");
		PLUKeep_Name_CheckBox.Text = Program.GetLang("pw_Name");
		PLUKeep_Price_CheckBox.Text = Program.GetLang("pw_UPrice");
		PLUKeep_SType_CheckBox.Text = Program.GetLang("pw_SpecialMode");
		PLUKeep_Tare_CheckBox.Text = Program.GetLang("pw_Tare");
		PLUKeep_PercentTare_CheckBox.Text = Program.GetLang("pw_PercentTare");
		PLUKeep_Tax_CheckBox.Text = Program.GetLang("pw_Tax");
		PLUKeep_Text1_CheckBox.Text = Program.GetLang("pw_Text1");
		PLUKeep_Text2_CheckBox.Text = Program.GetLang("pw_Text2");
		PLUKeep_Text3_CheckBox.Text = Program.GetLang("pw_Text3");
		PLUKeep_Text4_CheckBox.Text = Program.GetLang("pw_Text4");
		PLUKeep_Text5_CheckBox.Text = Program.GetLang("pw_Text5");
		PLUKeep_Text6_CheckBox.Text = Program.GetLang("pw_Text6");
		PLUKeep_Text7_CheckBox.Text = Program.GetLang("pw_Text7");
		CheckBox pLU_TimePD_CheckBox = PLU_TimePD_CheckBox;
		string text2 = (PLUKeep_TimePD_CheckBox.Text = Program.GetLang("pw_PackageDays"));
		pLU_TimePD_CheckBox.Text = text2;
		CheckBox pLU_TimePT_CheckBox = PLU_TimePT_CheckBox;
		string text3 = (PLUKeep_TimePT_CheckBox.Text = Program.GetLang("pw_PackageTime"));
		pLU_TimePT_CheckBox.Text = text3;
		CheckBox pLU_TimeSD_CheckBox = PLU_TimeSD_CheckBox;
		string text4 = (PLUKeep_TimeSD_CheckBox.Text = Program.GetLang("pw_SaleDays"));
		pLU_TimeSD_CheckBox.Text = text4;
		CheckBox pLU_TimeST_CheckBox = PLU_TimeST_CheckBox;
		string text5 = (PLUKeep_TimeST_CheckBox.Text = Program.GetLang("pw_SaleTime"));
		pLU_TimeST_CheckBox.Text = text5;
		CheckBox pLU_TimeUD_CheckBox = PLU_TimeUD_CheckBox;
		string text6 = (PLUKeep_TimeUD_CheckBox.Text = Program.GetLang("pw_ShelfDays"));
		pLU_TimeUD_CheckBox.Text = text6;
		PLUKeep_UnitID_CheckBox.Text = Program.GetLang("pw_Unit");
		barcodeCheckBox.Text = Program.GetLang("pw_Barcode");
		cancelButton.Text = Program.GetLang("pw_Cancel");
		classCheckBox.Text = Program.GetLang("pw_Class");
		deptCheckBox.Text = Program.GetLang("pw_Dept");
		faceCheckBox.Text = Program.GetLang("pw_Shortcutkey");
		labelCheckBox.Text = Program.GetLang("pw_PrintFormat");
		pLUCheckBox.Text = Program.GetLang("pw_PLU");
		wizardCheckBox.Text = Program.GetLang("pw_ConfigWizard");
		salesmanCheckBox.Text = Program.GetLang("pw_Salesman");
		specCheckBox.Text = Program.GetLang("pw_GlobalSpec");
		stringCheckBox.Text = Program.GetLang("pw_GlobalText");
		unitCheckBox.Text = Program.GetLang("pw_Unit");
		vipCheckBox.Text = Program.GetLang("pw_VIP");
		bitmapCheckBox.Text = Program.GetLang("pw_Bitmap");
		PLUFucEnable_GroupBox.Text = Program.GetLang("pw_PLUFunctionEnable");
		PLU_ALPHA_CheckBox.Text = Program.GetLang("pw_AlphaSearch");
		PLU_Measure_CheckBox.Text = Program.GetLang("pw_MeasureWord");
		PLU_SaveAsWeight_CheckBox.Text = Program.GetLang("pw_SaveAsWeight");
		PLU_TarePercent_CheckBox.Text = Program.GetLang("pw_PercentTare");
		PLU_Tare_CheckBox.Text = Program.GetLang("pw_Tare");
		PLU_FixedWeight_CheckBox.Text = Program.GetLang("pw_FixedWeight");
		PLU_Tax_CheckBox.Text = Program.GetLang("pw_Tax");
		PLU_Bill2_CheckBox.Text = Program.GetLang("pw_Bill2");
		PLU_SpecialMode_CheckBox.Text = Program.GetLang("pw_SpecialMode");
		PLU_Index_CheckBox.Text = Program.GetLang("pw_IndexBarcode");
		PLU_ItemCode_CheckBox.Text = Program.GetLang("pw_ItemCode");
		PLU_Class_CheckBox.Text = Program.GetLang("pw_AffiliatedClass");
		PLU_Discount_CheckBox.Text = Program.GetLang("pw_DiscountInfo");
		Payments_GroupBox.Text = Program.GetLang("pw_Payments");
		Common_TabPage.Text = Program.GetLang("pw_Common");
		Display_TabPage.Text = Program.GetLang("pw_Display");
		Enable_TabPage.Text = Program.GetLang("pw_EnableDisable");
		reportdatabaseReducer_CheckBox.Text = Program.GetLang("pw_DeleteOldLogs") + ":";
		rdrd_Label.Text = Program.GetLang("pw_Days");
		Font = (ctfont = Settings.Default.CustomFont);
		cb_PLUImportKeep = new CheckBox[36]
		{
			PLUKeep_Name_CheckBox, PLUKeep_ItemCode_CheckBox, PLUKeep_Index_CheckBox, PLUKeep_Class_CheckBox, PLUKeep_UnitID_CheckBox, PLUKeep_Tare_CheckBox, PLUKeep_PercentTare_CheckBox, PLUKeep_FixedWeight_CheckBox, PLUKeep_MeasureWord_CheckBox, PLUKeep_Price_CheckBox,
			PLUKeep_Cost_CheckBox, PLUKeep_Tax_CheckBox, PLUKeep_SSP1_CheckBox, PLUKeep_SSP2_CheckBox, PLUKeep_SSP3_CheckBox, PLUKeep_SSP4_CheckBox, PLUKeep_SType_CheckBox, PLUKeep_Label1_CheckBox, PLUKeep_Barcode1_CheckBox, PLUKeep_Label2_CheckBox,
			PLUKeep_Barcode2_CheckBox, PLUKeep_Bitmap_CheckBox, PLUKeep_Text1_CheckBox, PLUKeep_Text2_CheckBox, PLUKeep_Text3_CheckBox, PLUKeep_Text4_CheckBox, PLUKeep_Text5_CheckBox, PLUKeep_Text6_CheckBox, PLUKeep_Text7_CheckBox, PLUKeep_TimeSD_CheckBox,
			PLUKeep_TimeST_CheckBox, PLUKeep_TimePD_CheckBox, PLUKeep_TimePT_CheckBox, PLUKeep_TimeUD_CheckBox, PLUKeep_ManualDiscount_CheckBox, PLUKeep_AutoDiscount_CheckBox
		};
		for (int i = 0; i < 36; i++)
		{
			cb_PLUImportKeep[i].Checked = RDS.PLUImportKeep_Para[i] > 0;
		}
		PLUFuc_AlphaAuto_CheckBox.Checked = Settings.Default.PLUImportAlphaAG;
		CloseTray_CheckBox.Checked = Settings.Default.gen_CloseTray;
		AlwaysTray_CheckBox.Checked = Settings.Default.gen_AlwaysTray;
		TipOfTray_CheckBox.Checked = Settings.Default.gen_TipOfTray;
		wizardCheckBox.Checked = Settings.Default.Enable_Wizard;
		specCheckBox.Checked = Settings.Default.Enable_TMS;
		stringCheckBox.Checked = Settings.Default.Enable_TMT;
		faceCheckBox.Checked = Settings.Default.Enable_SCP;
		deptCheckBox.Checked = Settings.Default.Enable_Dept;
		classCheckBox.Checked = Settings.Default.Enable_Class;
		pLUCheckBox.Checked = Settings.Default.Enable_PLU;
		labelCheckBox.Checked = Settings.Default.Enable_Label;
		CheckBox checkBox = unitCheckBox;
		CheckBox checkBox2 = unitCheckBox;
		bool flag = (unitCheckBox.Visible = false);
		bool flag3 = (checkBox2.Enabled = flag);
		checkBox.Checked = flag3;
		barcodeCheckBox.Checked = Settings.Default.Enable_Barcode;
		salesmanCheckBox.Checked = Settings.Default.Enable_Salesman;
		vipCheckBox.Checked = Settings.Default.Enable_VIP;
		bitmapCheckBox.Checked = Settings.Default.Enable_Bitmap;
		ask_CheckBox.Checked = Settings.Default.gen_Ask;
		askPLU_CheckBox.Checked = Settings.Default.gen_AskPLU;
		askLogs_CheckBox.Checked = Settings.Default.gen_AskLogs;
		askLogs_OnlyIdle_CheckBox.Checked = Settings.Default.gen_AskLogs_OnlyIdle;
		costFromDevice_CheckBox.Checked = Settings.Default.gen_CostFromDevice;
		PLU_ALPHA_CheckBox.Checked = Settings.Default.Enable_PLU_AlphaSearch;
		PLU_Measure_CheckBox.Checked = Settings.Default.Enable_PLU_MeasureWord;
		PLU_SaveAsWeight_CheckBox.Checked = Settings.Default.Enable_PLU_PcsSaveInWeight;
		PLU_Tare_CheckBox.Checked = Settings.Default.Enable_PLU_Tare;
		PLU_TarePercent_CheckBox.Checked = Settings.Default.Enable_PLU_PercentTare;
		PLU_FixedWeight_CheckBox.Checked = Settings.Default.Enable_PLU_FixedWeight;
		PLU_Tax_CheckBox.Checked = Settings.Default.Enable_PLU_Tax;
		PLU_Bill2_CheckBox.Checked = Settings.Default.Enable_PLU_Bill2;
		PLU_SpecialMode_CheckBox.Checked = Settings.Default.Enable_PLU_SpecialMode;
		PLU_Discount_CheckBox.Checked = Settings.Default.Enable_PLU_Discount;
		PLU_ItemCode_CheckBox.Checked = Settings.Default.Enable_PLU_ItemCode;
		PLU_Index_CheckBox.Checked = Settings.Default.Enable_PLU_Index;
		PLU_Class_CheckBox.Checked = Settings.Default.Enable_PLU_Class;
		PLU_Bitmap_CheckBox.Checked = Settings.Default.Enable_PLU_Bitmap;
		PLU_TimeSD_CheckBox.Checked = Settings.Default.Enable_PLU_TimeSD;
		PLU_TimeST_CheckBox.Checked = Settings.Default.Enable_PLU_TimeST;
		PLU_TimePD_CheckBox.Checked = Settings.Default.Enable_PLU_TimePD;
		PLU_TimePT_CheckBox.Checked = Settings.Default.Enable_PLU_TimePT;
		PLU_TimeUD_CheckBox.Checked = Settings.Default.Enable_PLU_TimeUD;
		int gen_RDRD = Settings.Default.gen_RDRD;
		if (gen_RDRD == 0)
		{
			reportdatabaseReducer_CheckBox.Checked = false;
		}
		else
		{
			reportdatabaseReducer_CheckBox.Checked = true;
			rdrd_NumericUpDown.Value = gen_RDRD;
		}
		reportdatabaseReducer_CheckBox_Click(null, null);
		Ask_CheckBox_CheckedChanged(null, null);
		PLU_Fuc_CheckBox_CheckedChanged(null, null);
		if (!Settings.Default.Visible_Wizard)
		{
			wizardCheckBox.Checked = false;
			wizardCheckBox.Enabled = false;
		}
		if (!Settings.Default.Visible_VIP)
		{
			vipCheckBox.Checked = false;
			vipCheckBox.Enabled = false;
		}
		FindCustom();
		if (custom1Row == null)
		{
			CheckBox pLUKeep_SSP1_CheckBox = PLUKeep_SSP1_CheckBox;
			bool visible = (custom1CheckBox.Visible = false);
			pLUKeep_SSP1_CheckBox.Visible = visible;
		}
		else
		{
			CheckBox pLUKeep_SSP1_CheckBox2 = PLUKeep_SSP1_CheckBox;
			bool visible2 = (custom1CheckBox.Visible = custom1Row.Visible);
			pLUKeep_SSP1_CheckBox2.Visible = visible2;
			CheckBox pLUKeep_SSP1_CheckBox3 = PLUKeep_SSP1_CheckBox;
			string text7 = (custom1CheckBox.Text = custom1Row.Display);
			pLUKeep_SSP1_CheckBox3.Text = text7;
		}
		if (custom2Row == null)
		{
			CheckBox pLUKeep_SSP2_CheckBox = PLUKeep_SSP2_CheckBox;
			bool visible4 = (custom2CheckBox.Visible = false);
			pLUKeep_SSP2_CheckBox.Visible = visible4;
		}
		else
		{
			CheckBox pLUKeep_SSP2_CheckBox2 = PLUKeep_SSP2_CheckBox;
			bool visible5 = (custom2CheckBox.Visible = custom2Row.Visible);
			pLUKeep_SSP2_CheckBox2.Visible = visible5;
			CheckBox pLUKeep_SSP2_CheckBox3 = PLUKeep_SSP2_CheckBox;
			string text8 = (custom2CheckBox.Text = custom2Row.Display);
			pLUKeep_SSP2_CheckBox3.Text = text8;
		}
		if (custom3Row == null)
		{
			CheckBox pLUKeep_SSP3_CheckBox = PLUKeep_SSP3_CheckBox;
			bool visible7 = (custom3CheckBox.Visible = false);
			pLUKeep_SSP3_CheckBox.Visible = visible7;
		}
		else
		{
			CheckBox pLUKeep_SSP3_CheckBox2 = PLUKeep_SSP3_CheckBox;
			bool visible8 = (custom3CheckBox.Visible = custom3Row.Visible);
			pLUKeep_SSP3_CheckBox2.Visible = visible8;
			CheckBox pLUKeep_SSP3_CheckBox3 = PLUKeep_SSP3_CheckBox;
			string text9 = (custom3CheckBox.Text = custom3Row.Display);
			pLUKeep_SSP3_CheckBox3.Text = text9;
		}
		if (custom4Row == null)
		{
			CheckBox pLUKeep_SSP4_CheckBox = PLUKeep_SSP4_CheckBox;
			bool visible10 = (custom4CheckBox.Visible = false);
			pLUKeep_SSP4_CheckBox.Visible = visible10;
		}
		else
		{
			CheckBox pLUKeep_SSP4_CheckBox2 = PLUKeep_SSP4_CheckBox;
			bool visible11 = (custom4CheckBox.Visible = custom4Row.Visible);
			pLUKeep_SSP4_CheckBox2.Visible = visible11;
			CheckBox pLUKeep_SSP4_CheckBox3 = PLUKeep_SSP4_CheckBox;
			string text10 = (custom4CheckBox.Text = custom4Row.Display);
			pLUKeep_SSP4_CheckBox3.Text = text10;
		}
		custom1CheckBox.Checked = Settings.Default.Enable_Custum1;
		custom2CheckBox.Checked = Settings.Default.Enable_Custum2;
		custom3CheckBox.Checked = Settings.Default.Enable_Custum3;
		custom4CheckBox.Checked = Settings.Default.Enable_Custum4;
		multiStock_CheckBox.Checked = Settings.Default.gen_MultiStock;
		dockingEthernet_CheckBox.Checked = Settings.Default.gen_DockingEthernet;
		dockingReport_CheckBox.Checked = Settings.Default.gen_DockingReport;
		openGuider_CheckBox.Checked = Settings.Default.gen_OpenGuider;
		if (Settings.Default.gen_dtType_Date == "dd-MM-yy")
		{
			DT_DD_MM_YY_RadioButton.Checked = true;
		}
		else if (Settings.Default.gen_dtType_Date == "dd/MM/yy")
		{
			DT_DDzMMzYY_RadioButton.Checked = true;
		}
		else if (Settings.Default.gen_dtType_Date == "MM-dd-yy")
		{
			DT_MM_DD_YY_RadioButton.Checked = true;
		}
		else if (Settings.Default.gen_dtType_Date == "MM/dd/yy")
		{
			DT_MMzDDzYY_RadioButton.Checked = true;
		}
		else if (Settings.Default.gen_dtType_Date == "yy.MM.dd")
		{
			DT_YYoMMoDD_RadioButton.Checked = true;
		}
		else
		{
			DT_YYYYoMMoDD_RadioButton.Checked = true;
		}
		if (Settings.Default.gen_dtType_Time == "hh:mm:ss tt")
		{
			DT_12H_RadioButton.Checked = true;
		}
		else
		{
			DT_24H_RadioButton.Checked = true;
		}
		if (Settings.Default.Text_Payment1.Length == 0)
		{
			Payment1_TextBox.Text = Program.GetLang("pw_Payment1");
			Payment1_TextBox.Enabled = false;
		}
		else
		{
			Payment1_TextBox.Text = Settings.Default.Text_Payment1;
			Payment1_TextBox.Enabled = true;
		}
		if (Settings.Default.Text_Payment2.Length == 0)
		{
			Payment2_TextBox.Text = Program.GetLang("pw_Payment2");
			Payment2_TextBox.Enabled = false;
		}
		else
		{
			Payment2_TextBox.Text = Settings.Default.Text_Payment2;
			Payment2_TextBox.Enabled = true;
		}
		if (Settings.Default.Text_Payment3.Length == 0)
		{
			Payment3_TextBox.Text = Program.GetLang("pw_Payment3");
			Payment3_TextBox.Enabled = false;
		}
		else
		{
			Payment3_TextBox.Text = Settings.Default.Text_Payment3;
			Payment3_TextBox.Enabled = true;
		}
		if (Program.right == Program.Right.User)
		{
			GroupBox payments_GroupBox = Payments_GroupBox;
			GroupBox font_GroupBox = Font_GroupBox;
			GroupBox menuEnable_GroupBox = MenuEnable_GroupBox;
			bool flag9 = (PLUFucEnable_GroupBox.Enabled = false);
			bool flag11 = (menuEnable_GroupBox.Enabled = flag9);
			bool enabled = (font_GroupBox.Enabled = flag11);
			payments_GroupBox.Enabled = enabled;
		}
		if (Program.mf != null && Program.mf.startup != null)
		{
			CloseTray_CheckBox.Checked = true;
			CloseTray_CheckBox.Enabled = false;
		}
		Program.LabelRight_SetXLocaltion(new Control[1] { reportdatabaseReducer_CheckBox }, new Control[4] { rdrd_d2_NumericUpDown, rdd_Label, rdrd_NumericUpDown, rdrd_Label });
		PLUKeep_UnitID_CheckBox_CheckedChanged(null, null);
		Main_TabControl_SelectedIndexChanged(null, null);
		if (Program.LangSocket.Contains("Ramuza"))
		{
			LangSocket_Ramuza();
		}
		if (Program.LangSocket.Contains("NoTare") && !PLU_Tare_CheckBox.Checked)
		{
			PLU_Tare_CheckBox.Visible = false;
			PLU_TarePercent_CheckBox.Visible = false;
		}
	}

	private void okButton_Click(object sender, EventArgs e)
	{
		bool flag = false;
		if (Program.right != Program.Right.User)
		{
			Settings.Default.CustomFont = ctfont;
			Settings.Default.Enable_Wizard = wizardCheckBox.Checked;
			Settings.Default.Enable_TMS = specCheckBox.Checked;
			Settings.Default.Enable_TMT = stringCheckBox.Checked;
			Settings.Default.Enable_SCP = faceCheckBox.Checked;
			Settings.Default.Enable_Dept = deptCheckBox.Checked;
			Settings.Default.Enable_Class = classCheckBox.Checked;
			Settings.Default.Enable_PLU = pLUCheckBox.Checked;
			Settings.Default.Enable_Label = labelCheckBox.Checked;
			Settings.Default.Enable_Unit = unitCheckBox.Checked;
			Settings.Default.Enable_Barcode = barcodeCheckBox.Checked;
			Settings.Default.Enable_Salesman = salesmanCheckBox.Checked;
			Settings.Default.Enable_VIP = vipCheckBox.Checked;
			Settings.Default.Enable_Bitmap = bitmapCheckBox.Checked;
			Settings.Default.Enable_Custum1 = custom1CheckBox.Checked;
			Settings.Default.Enable_Custum2 = custom2CheckBox.Checked;
			Settings.Default.Enable_Custum3 = custom3CheckBox.Checked;
			Settings.Default.Enable_Custum4 = custom4CheckBox.Checked;
			Settings.Default.Enable_PLU_AlphaSearch = PLU_ALPHA_CheckBox.Checked;
			Settings.Default.Enable_PLU_MeasureWord = PLU_Measure_CheckBox.Checked;
			Settings.Default.Enable_PLU_PcsSaveInWeight = PLU_SaveAsWeight_CheckBox.Checked;
			Settings.Default.Enable_PLU_Tare = PLU_Tare_CheckBox.Checked;
			Settings.Default.Enable_PLU_PercentTare = PLU_TarePercent_CheckBox.Checked;
			Settings.Default.Enable_PLU_FixedWeight = PLU_FixedWeight_CheckBox.Checked;
			Settings.Default.Enable_PLU_Tax = PLU_Tax_CheckBox.Checked;
			Settings.Default.Enable_PLU_Bill2 = PLU_Bill2_CheckBox.Checked;
			Settings.Default.Enable_PLU_SpecialMode = PLU_SpecialMode_CheckBox.Checked;
			Settings.Default.Enable_PLU_Discount = PLU_Discount_CheckBox.Checked;
			Settings.Default.Enable_PLU_ItemCode = PLU_ItemCode_CheckBox.Checked;
			Settings.Default.Enable_PLU_Index = PLU_Index_CheckBox.Checked;
			Settings.Default.Enable_PLU_Class = PLU_Class_CheckBox.Checked;
			Settings.Default.Enable_PLU_Bitmap = PLU_Bitmap_CheckBox.Checked;
			Settings.Default.Enable_PLU_TimeSD = PLU_TimeSD_CheckBox.Checked;
			Settings.Default.Enable_PLU_TimeST = PLU_TimeST_CheckBox.Checked;
			Settings.Default.Enable_PLU_TimePD = PLU_TimePD_CheckBox.Checked;
			Settings.Default.Enable_PLU_TimePT = PLU_TimePT_CheckBox.Checked;
			Settings.Default.Enable_PLU_TimeUD = PLU_TimeUD_CheckBox.Checked;
			if (Payment1_CheckBox.Checked)
			{
				Settings.Default.Text_Payment1 = Payment1_TextBox.Text.Trim();
			}
			if (Payment2_CheckBox.Checked)
			{
				Settings.Default.Text_Payment2 = Payment2_TextBox.Text.Trim();
			}
			if (Payment3_CheckBox.Checked)
			{
				Settings.Default.Text_Payment3 = Payment3_TextBox.Text.Trim();
			}
		}
		Settings.Default.gen_MultiStock = multiStock_CheckBox.Checked;
		Settings.Default.gen_DockingEthernet = dockingEthernet_CheckBox.Checked;
		Settings.Default.gen_DockingReport = dockingReport_CheckBox.Checked;
		Settings.Default.gen_OpenGuider = openGuider_CheckBox.Checked;
		if (reportdatabaseReducer_CheckBox.Checked)
		{
			Settings.Default.gen_RDRD = (int)rdrd_NumericUpDown.Value;
		}
		else
		{
			Settings.Default.gen_RDRD = 0;
		}
		if (DT_DD_MM_YY_RadioButton.Checked)
		{
			Settings.Default.gen_dtType_Date = "dd-MM-yy";
		}
		else if (DT_DDzMMzYY_RadioButton.Checked)
		{
			Settings.Default.gen_dtType_Date = "dd/MM/yy";
		}
		else if (DT_MM_DD_YY_RadioButton.Checked)
		{
			Settings.Default.gen_dtType_Date = "MM-dd-yy";
		}
		else if (DT_MMzDDzYY_RadioButton.Checked)
		{
			Settings.Default.gen_dtType_Date = "MM/dd/yy";
		}
		else if (DT_YYoMMoDD_RadioButton.Checked)
		{
			Settings.Default.gen_dtType_Date = "yy.MM.dd";
		}
		else
		{
			Settings.Default.gen_dtType_Date = "yyyy.MM.dd";
		}
		if (DT_12H_RadioButton.Checked)
		{
			Settings.Default.gen_dtType_Time = "hh:mm:ss tt";
		}
		else
		{
			Settings.Default.gen_dtType_Time = "HH:mm:ss";
		}
		string text = "";
		for (int i = 0; i < cb_PLUImportKeep.Length; i++)
		{
			text += (cb_PLUImportKeep[i].Checked ? "2" : "0");
		}
		Settings.Default.PLUImportKeep = text;
		Settings.Default.PLUImportAlphaAG = PLUFuc_AlphaAuto_CheckBox.Checked;
		if (ask_CheckBox.Checked && (ask_CheckBox.Checked != Settings.Default.gen_Ask || askPLU_CheckBox.Checked != Settings.Default.gen_AskPLU || askLogs_CheckBox.Checked != Settings.Default.gen_AskLogs || askLogs_OnlyIdle_CheckBox.Checked != Settings.Default.gen_AskLogs_OnlyIdle))
		{
			flag = true;
		}
		Settings.Default.gen_Ask = ask_CheckBox.Checked;
		Settings.Default.gen_AskPLU = askPLU_CheckBox.Checked;
		Settings.Default.gen_AskLogs = askLogs_CheckBox.Checked;
		Settings.Default.gen_AskLogs_OnlyIdle = askLogs_OnlyIdle_CheckBox.Checked;
		Settings.Default.gen_CostFromDevice = costFromDevice_CheckBox.Checked;
		Settings.Default.gen_CloseTray = CloseTray_CheckBox.Checked;
		Settings.Default.gen_AlwaysTray = AlwaysTray_CheckBox.Checked;
		Settings.Default.gen_TipOfTray = TipOfTray_CheckBox.Checked;
		Settings.Default.Save();
		RDS.PLUImportKeep_Get();
		if (Program.mf != null)
		{
			Program.mf.UpdateRight();
			Program.mf.mf_Dock_Guider_Judge();
			if (flag && Program.mf.m_netForm != null && !Program.mf.m_netForm.IsDisposed)
			{
				Program.mf.m_netForm.UpdateAskAll();
			}
		}
		Close();
	}

	private void fontButton_Click(object sender, EventArgs e)
	{
		FontDialog fontDialog = new FontDialog();
		fontDialog.Font = ctfont;
		if (fontDialog.ShowDialog(this) == DialogResult.OK)
		{
			Font = (ctfont = fontDialog.Font);
			Invalidate();
		}
	}

	private void defaultFontButton_Click(object sender, EventArgs e)
	{
		Font = (ctfont = SystemFonts.DefaultFont);
		Invalidate();
	}

	private void openGuider_CheckBox_CheckedChanged(object sender, EventArgs e)
	{
		CheckBox checkBox = dockingEthernet_CheckBox;
		bool enabled = (dockingReport_CheckBox.Enabled = openGuider_CheckBox.Checked);
		checkBox.Enabled = enabled;
	}

	private void Ask_CheckBox_CheckedChanged(object sender, EventArgs e)
	{
		CheckBox checkBox = askPLU_CheckBox;
		bool enabled = (askLogs_CheckBox.Enabled = ask_CheckBox.Checked);
		checkBox.Enabled = enabled;
		askLogs_OnlyIdle_CheckBox.Enabled = ask_CheckBox.Checked && askLogs_CheckBox.Checked;
	}

	private void Payment1_CheckBox_CheckedChanged(object sender, EventArgs e)
	{
		if (!Payment1_CheckBox.Checked)
		{
			Payment1_TextBox.Text = Program.GetLang("pw_Payment1");
		}
		Payment1_TextBox.Enabled = Payment1_CheckBox.Checked;
	}

	private void Payment2_CheckBox_CheckedChanged(object sender, EventArgs e)
	{
		if (!Payment2_CheckBox.Checked)
		{
			Payment2_TextBox.Text = Program.GetLang("pw_Payment2");
		}
		Payment2_TextBox.Enabled = Payment2_CheckBox.Checked;
	}

	private void Payment3_CheckBox_CheckedChanged(object sender, EventArgs e)
	{
		if (!Payment3_CheckBox.Checked)
		{
			Payment3_TextBox.Text = Program.GetLang("pw_Payment3");
		}
		Payment3_TextBox.Enabled = Payment3_CheckBox.Checked;
	}

	private void PLUKeep_UnitID_CheckBox_CheckedChanged(object sender, EventArgs e)
	{
		if (PLUKeep_UnitID_CheckBox.Checked)
		{
			CheckBox pLUKeep_Tare_CheckBox = PLUKeep_Tare_CheckBox;
			CheckBox pLUKeep_PercentTare_CheckBox = PLUKeep_PercentTare_CheckBox;
			CheckBox pLUKeep_FixedWeight_CheckBox = PLUKeep_FixedWeight_CheckBox;
			CheckBox pLUKeep_MeasureWord_CheckBox = PLUKeep_MeasureWord_CheckBox;
			bool flag = (PLUKeep_SaveAsWeight_CheckBox.Enabled = true);
			bool flag3 = (pLUKeep_MeasureWord_CheckBox.Enabled = flag);
			bool flag5 = (pLUKeep_FixedWeight_CheckBox.Enabled = flag3);
			bool enabled = (pLUKeep_PercentTare_CheckBox.Enabled = flag5);
			pLUKeep_Tare_CheckBox.Enabled = enabled;
			return;
		}
		CheckBox pLUKeep_Tare_CheckBox2 = PLUKeep_Tare_CheckBox;
		CheckBox pLUKeep_PercentTare_CheckBox2 = PLUKeep_PercentTare_CheckBox;
		CheckBox pLUKeep_FixedWeight_CheckBox2 = PLUKeep_FixedWeight_CheckBox;
		CheckBox pLUKeep_MeasureWord_CheckBox2 = PLUKeep_MeasureWord_CheckBox;
		bool flag8 = (PLUKeep_SaveAsWeight_CheckBox.Enabled = false);
		bool flag10 = (pLUKeep_MeasureWord_CheckBox2.Enabled = flag8);
		bool flag12 = (pLUKeep_FixedWeight_CheckBox2.Enabled = flag10);
		bool enabled2 = (pLUKeep_PercentTare_CheckBox2.Enabled = flag12);
		pLUKeep_Tare_CheckBox2.Enabled = enabled2;
		CheckBox pLUKeep_Tare_CheckBox3 = PLUKeep_Tare_CheckBox;
		CheckBox pLUKeep_PercentTare_CheckBox3 = PLUKeep_PercentTare_CheckBox;
		CheckBox pLUKeep_FixedWeight_CheckBox3 = PLUKeep_FixedWeight_CheckBox;
		CheckBox pLUKeep_MeasureWord_CheckBox3 = PLUKeep_MeasureWord_CheckBox;
		bool flag15 = (PLUKeep_SaveAsWeight_CheckBox.Checked = false);
		bool flag17 = (pLUKeep_MeasureWord_CheckBox3.Checked = flag15);
		bool flag19 = (pLUKeep_FixedWeight_CheckBox3.Checked = flag17);
		bool flag21 = (pLUKeep_PercentTare_CheckBox3.Checked = flag19);
		pLUKeep_Tare_CheckBox3.Checked = flag21;
	}

	private void PLU_Fuc_CheckBox_CheckedChanged(object sender, EventArgs e)
	{
		Function_GroupBox.Visible = PLU_ALPHA_CheckBox.Checked;
		if (!PLU_ALPHA_CheckBox.Checked)
		{
			PLUFuc_AlphaAuto_CheckBox.Checked = false;
		}
		PLUKeep_ItemCode_CheckBox.Visible = PLU_ItemCode_CheckBox.Checked;
		if (!PLU_ItemCode_CheckBox.Checked)
		{
			PLUKeep_ItemCode_CheckBox.Checked = false;
		}
		PLUKeep_Index_CheckBox.Visible = PLU_Index_CheckBox.Checked;
		if (!PLU_Index_CheckBox.Checked)
		{
			PLUKeep_Index_CheckBox.Checked = false;
		}
		PLUKeep_Class_CheckBox.Visible = PLU_Class_CheckBox.Checked;
		if (!PLU_Class_CheckBox.Checked)
		{
			PLUKeep_Class_CheckBox.Checked = false;
		}
		CheckBox pLUKeep_ManualDiscount_CheckBox = PLUKeep_ManualDiscount_CheckBox;
		bool visible = (PLUKeep_AutoDiscount_CheckBox.Visible = PLU_Discount_CheckBox.Checked);
		pLUKeep_ManualDiscount_CheckBox.Visible = visible;
		if (!PLU_Discount_CheckBox.Checked)
		{
			CheckBox pLUKeep_ManualDiscount_CheckBox2 = PLUKeep_ManualDiscount_CheckBox;
			bool flag2 = (PLUKeep_AutoDiscount_CheckBox.Checked = false);
			pLUKeep_ManualDiscount_CheckBox2.Checked = flag2;
		}
		PLUKeep_Tare_CheckBox.Visible = PLU_Tare_CheckBox.Checked;
		if (!PLU_Tare_CheckBox.Checked)
		{
			PLUKeep_Tare_CheckBox.Checked = false;
		}
		if (PLU_Tare_CheckBox.Checked)
		{
			PLU_TarePercent_CheckBox.Enabled = true;
			PLUKeep_PercentTare_CheckBox.Visible = PLU_TarePercent_CheckBox.Checked;
			if (!PLU_TarePercent_CheckBox.Checked)
			{
				PLUKeep_PercentTare_CheckBox.Checked = false;
			}
		}
		else
		{
			CheckBox pLUKeep_PercentTare_CheckBox = PLUKeep_PercentTare_CheckBox;
			bool visible2 = (PLU_TarePercent_CheckBox.Enabled = false);
			pLUKeep_PercentTare_CheckBox.Visible = visible2;
			CheckBox pLUKeep_PercentTare_CheckBox2 = PLUKeep_PercentTare_CheckBox;
			bool flag5 = (PLU_TarePercent_CheckBox.Checked = false);
			pLUKeep_PercentTare_CheckBox2.Checked = flag5;
		}
		PLUKeep_MeasureWord_CheckBox.Visible = PLU_Measure_CheckBox.Checked;
		if (!PLU_Measure_CheckBox.Checked)
		{
			PLUKeep_MeasureWord_CheckBox.Checked = false;
		}
		PLUKeep_SaveAsWeight_CheckBox.Visible = PLU_SaveAsWeight_CheckBox.Checked;
		if (!PLU_SaveAsWeight_CheckBox.Checked)
		{
			PLUKeep_SaveAsWeight_CheckBox.Checked = false;
		}
		PLUKeep_FixedWeight_CheckBox.Visible = PLU_FixedWeight_CheckBox.Checked;
		if (!PLU_FixedWeight_CheckBox.Checked)
		{
			PLUKeep_FixedWeight_CheckBox.Checked = false;
		}
		PLUKeep_Tax_CheckBox.Visible = PLU_Tax_CheckBox.Checked;
		if (!PLU_Tax_CheckBox.Checked)
		{
			PLUKeep_Tax_CheckBox.Checked = false;
		}
		PLUKeep_SType_CheckBox.Visible = PLU_SpecialMode_CheckBox.Checked;
		if (!PLU_SpecialMode_CheckBox.Checked)
		{
			PLUKeep_SType_CheckBox.Checked = false;
		}
		PLUKeep_Bitmap_CheckBox.Visible = PLU_Bitmap_CheckBox.Checked;
		if (!PLU_Bitmap_CheckBox.Checked)
		{
			PLUKeep_Bitmap_CheckBox.Checked = false;
		}
		PLUKeep_TimeSD_CheckBox.Visible = PLU_TimeSD_CheckBox.Checked;
		if (!PLU_TimeSD_CheckBox.Checked)
		{
			PLUKeep_TimeSD_CheckBox.Checked = false;
		}
		PLUKeep_TimeST_CheckBox.Visible = PLU_TimeST_CheckBox.Checked;
		if (!PLU_TimeST_CheckBox.Checked)
		{
			PLUKeep_TimeST_CheckBox.Checked = false;
		}
		PLUKeep_TimePD_CheckBox.Visible = PLU_TimePD_CheckBox.Checked;
		if (!PLU_TimePD_CheckBox.Checked)
		{
			PLUKeep_TimePD_CheckBox.Checked = false;
		}
		PLUKeep_TimePT_CheckBox.Visible = PLU_TimePT_CheckBox.Checked;
		if (!PLU_TimePT_CheckBox.Checked)
		{
			PLUKeep_TimePT_CheckBox.Checked = false;
		}
		PLUKeep_TimeUD_CheckBox.Visible = PLU_TimeUD_CheckBox.Checked;
		if (!PLU_TimeUD_CheckBox.Checked)
		{
			PLUKeep_TimeUD_CheckBox.Checked = false;
		}
		CheckBox pLUKeep_Label2_CheckBox = PLUKeep_Label2_CheckBox;
		bool visible3 = (PLUKeep_Barcode2_CheckBox.Visible = PLU_Bill2_CheckBox.Checked);
		pLUKeep_Label2_CheckBox.Visible = visible3;
		if (!PLU_Bill2_CheckBox.Checked)
		{
			CheckBox pLUKeep_Label2_CheckBox2 = PLUKeep_Label2_CheckBox;
			bool flag8 = (PLUKeep_Barcode2_CheckBox.Checked = false);
			pLUKeep_Label2_CheckBox2.Checked = flag8;
			PLUKeep_Barcode1_CheckBox.Text = Program.GetLang("pw_Barcode");
			PLUKeep_Label1_CheckBox.Text = Program.GetLang("pw_PrintFormat");
		}
		else
		{
			PLUKeep_Barcode1_CheckBox.Text = Program.GetLang("pw_Bill1") + "-" + Program.GetLang("pw_Barcode");
			PLUKeep_Barcode2_CheckBox.Text = Program.GetLang("pw_Bill2") + "-" + Program.GetLang("pw_Barcode");
			PLUKeep_Label1_CheckBox.Text = Program.GetLang("pw_Bill1") + "-" + Program.GetLang("pw_PrintFormat");
			PLUKeep_Label2_CheckBox.Text = Program.GetLang("pw_Bill2") + "-" + Program.GetLang("pw_PrintFormat");
		}
	}

	private void PLU_ALPHA_CheckBox_Click(object sender, EventArgs e)
	{
		if (PLU_ALPHA_CheckBox.Checked)
		{
			PLUFuc_AlphaAuto_CheckBox.Checked = true;
		}
	}

	private void Main_TabControl_SelectedIndexChanged(object sender, EventArgs e)
	{
		if (Main_TabControl.SelectedIndex == 3)
		{
			Information_Label.Text = string.Format(Program.GetLang("pw_UsedForXandY"), Program.GetLang("pw_CustomFile"), Program.GetLang("pw_ExcelCSVFile"));
		}
		else
		{
			Information_Label.Text = "";
		}
	}

	private void reportdatabaseReducer_CheckBox_Click(object sender, EventArgs e)
	{
		if (reportdatabaseReducer_CheckBox.Checked)
		{
			rdrd_NumericUpDown.Enabled = true;
			return;
		}
		rdrd_NumericUpDown.Value = 32m;
		rdrd_NumericUpDown.Enabled = false;
	}

	private void rdrd_NumericUpDown_ValueChanged(object sender, EventArgs e)
	{
		rdrd_d2_NumericUpDown.Value = (int)(rdrd_NumericUpDown.Value * 2m / 3m);
	}
}
