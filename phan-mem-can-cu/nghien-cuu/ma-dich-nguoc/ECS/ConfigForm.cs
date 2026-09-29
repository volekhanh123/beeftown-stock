using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Threading;
using System.Windows.Forms;
using ECS.Properties;

namespace ECS;

public class ConfigForm : Form
{
	private IContainer components;

	private ComboBox configComboBox;

	private Button okButton;

	private Button cancelButton;

	private UIDataSet uIDataSet;

	private BindingSource configBindingSource;

	public UIDataSet TargetLang = new UIDataSet();

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
		this.components = new System.ComponentModel.Container();
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.ConfigForm));
		this.configComboBox = new System.Windows.Forms.ComboBox();
		this.configBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.uIDataSet = new ECS.UIDataSet();
		this.okButton = new System.Windows.Forms.Button();
		this.cancelButton = new System.Windows.Forms.Button();
		((System.ComponentModel.ISupportInitialize)this.configBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).BeginInit();
		base.SuspendLayout();
		this.configComboBox.DataSource = this.configBindingSource;
		this.configComboBox.DisplayMember = "Name";
		this.configComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.configComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.configComboBox, "configComboBox");
		this.configComboBox.Name = "configComboBox";
		this.configComboBox.ValueMember = "Name";
		this.configComboBox.SelectedIndexChanged += new System.EventHandler(configComboBox_SelectedIndexChanged);
		this.configBindingSource.DataMember = "Config";
		this.configBindingSource.DataSource = this.uIDataSet;
		this.uIDataSet.DataSetName = "UIDataSet";
		this.uIDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uIDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.okButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.okButton, "okButton");
		this.okButton.Name = "okButton";
		this.okButton.UseVisualStyleBackColor = true;
		this.okButton.Click += new System.EventHandler(okButton_Click);
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		resources.ApplyResources(this.cancelButton, "cancelButton");
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		base.AcceptButton = this.okButton;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.CancelButton = this.cancelButton;
		base.Controls.Add(this.cancelButton);
		base.Controls.Add(this.okButton);
		base.Controls.Add(this.configComboBox);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "ConfigForm";
		base.Load += new System.EventHandler(ConfigForm_Load);
		((System.ComponentModel.ISupportInitialize)this.configBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).EndInit();
		base.ResumeLayout(false);
	}

	public ConfigForm()
	{
		InitializeComponent();
	}

	private void ConfigForm_Load(object sender, EventArgs e)
	{
		Font = Settings.Default.CustomFont;
		string fileName = Application.StartupPath + "\\Config\\Config.xml";
		uIDataSet.Config.ReadXml(fileName);
		configComboBox.SelectedValue = Settings.Default.configName;
		if (configComboBox.SelectedIndex == -1)
		{
			configComboBox.SelectedIndex = 0;
		}
		configComboBox_SelectedIndexChanged();
		base.Icon = new Icon(Application.StartupPath + "\\Resources\\logo.ico");
	}

	private void okButton_Click(object sender, EventArgs e)
	{
		if (configComboBox.SelectedValue != null)
		{
			string text = (string)configComboBox.SelectedValue;
			Program.SaveDirty();
			Settings.Default.dirty = false;
			Settings.Default.reboot = true;
			UIDataSet.ConfigRow configRow = uIDataSet.Config.FindByName(text);
			Settings.Default.configName = text;
			Settings.Default.configFolder = configRow.Folder;
			Settings.Default.configEncoding = configRow.Encoding;
			Settings.Default.Save();
			Thread.Sleep(1000);
			Application.Restart();
		}
	}

	public string GetLang(string name)
	{
		UIDataSet.LangRow langRow = TargetLang.Lang.FindByName(name);
		if (langRow != null)
		{
			return langRow.Display;
		}
		return Program.GetLang(name);
	}

	private static void MergeUIDataSet(UIDataSet uiDataSet, string fileName)
	{
		if (!File.Exists(fileName))
		{
			return;
		}
		using UIDataSet uIDataSet = new UIDataSet();
		try
		{
			uIDataSet.ReadXml(fileName);
			uiDataSet.Merge(uIDataSet);
		}
		catch
		{
		}
	}

	private void configComboBox_SelectedIndexChanged()
	{
		TargetLang.Clear();
		if (configComboBox.SelectedItem != null)
		{
			CultureInfo cultureInfo = new CultureInfo(((UIDataSet.ConfigRow)((DataRowView)configComboBox.SelectedItem).Row).Lang);
			string name = cultureInfo.Parent.Name;
			string name2 = cultureInfo.Name;
			string configFolder = Settings.Default.configFolder;
			string fileName = string.Format("{0}\\{1}\\{2}", Application.StartupPath, name, "\\Lang.xml");
			string text = string.Format("{0}\\{1}\\{2}", Application.StartupPath, name2, "\\Lang.xml");
			string fileName2 = string.Format("{0}\\Config\\{1}\\{2}", Application.StartupPath, configFolder, "\\Lang.xml");
			string text2 = string.Format("{0}\\Config\\{1}", Application.StartupPath, "\\Lang.xml");
			MergeUIDataSet(TargetLang, fileName);
			if (File.Exists(text))
			{
				MergeUIDataSet(TargetLang, text);
			}
			MergeUIDataSet(TargetLang, fileName2);
			if (File.Exists(text2))
			{
				MergeUIDataSet(TargetLang, text2);
			}
		}
		Text = GetLang("pw_Config");
		cancelButton.Text = GetLang("pw_Cancel");
		okButton.Text = GetLang("pw_OK");
	}

	private void configComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		configComboBox_SelectedIndexChanged();
	}
}
