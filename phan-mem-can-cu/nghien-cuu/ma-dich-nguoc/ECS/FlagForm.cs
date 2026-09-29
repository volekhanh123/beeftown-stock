using System;
using System.ComponentModel;
using System.Data;
using System.Globalization;
using System.Windows.Forms;
using ECS.Properties;

namespace ECS;

public class FlagForm : Form
{
	private enum PrintApp_Flag1
	{
		Barcode,
		Item,
		Sale,
		Text,
		Border,
		Area,
		Bitmap,
		Special
	}

	private IContainer components;

	private BindingSource labelItemFlag1BindingSource;

	private UIDataSet uIDataSet;

	private BindingSource labelItemFlag1LabelItemFlag2BindingSource;

	private BindingSource labelItemFlag1LabelItemFlag3BindingSource;

	private ComboBox flag1ComboBox;

	private ComboBox flag2ComboBox;

	private ComboBox flag3ComboBox;

	private Button okButton;

	private TextBox textBox;

	private BindingSource labelItemFlag2LabelItemFlag4BindingSource;

	private Button cancelButton;

	public int Flag1 = -1;

	public int Flag2 = -1;

	public int Flag3 = -1;

	public string[] text = new string[32];

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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.FlagForm));
		this.flag1ComboBox = new System.Windows.Forms.ComboBox();
		this.labelItemFlag1BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.uIDataSet = new ECS.UIDataSet();
		this.flag2ComboBox = new System.Windows.Forms.ComboBox();
		this.labelItemFlag1LabelItemFlag2BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.flag3ComboBox = new System.Windows.Forms.ComboBox();
		this.labelItemFlag1LabelItemFlag3BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.okButton = new System.Windows.Forms.Button();
		this.textBox = new System.Windows.Forms.TextBox();
		this.labelItemFlag2LabelItemFlag4BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.cancelButton = new System.Windows.Forms.Button();
		((System.ComponentModel.ISupportInitialize)this.labelItemFlag1BindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemFlag1LabelItemFlag2BindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemFlag1LabelItemFlag3BindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemFlag2LabelItemFlag4BindingSource).BeginInit();
		base.SuspendLayout();
		this.flag1ComboBox.DataSource = this.labelItemFlag1BindingSource;
		this.flag1ComboBox.DisplayMember = "Display";
		this.flag1ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.flag1ComboBox.DropDownWidth = 250;
		this.flag1ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.flag1ComboBox, "flag1ComboBox");
		this.flag1ComboBox.Name = "flag1ComboBox";
		this.flag1ComboBox.ValueMember = "Flag1";
		this.flag1ComboBox.SelectionChangeCommitted += new System.EventHandler(flagComboBox_SelectedIndexChanged);
		this.labelItemFlag1BindingSource.DataMember = "LabelItem_Flag1";
		this.labelItemFlag1BindingSource.DataSource = this.uIDataSet;
		this.uIDataSet.DataSetName = "UIDataSet";
		this.uIDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uIDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.flag2ComboBox.DataSource = this.labelItemFlag1LabelItemFlag2BindingSource;
		this.flag2ComboBox.DisplayMember = "Display";
		this.flag2ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.flag2ComboBox.DropDownWidth = 250;
		this.flag2ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.flag2ComboBox, "flag2ComboBox");
		this.flag2ComboBox.Name = "flag2ComboBox";
		this.flag2ComboBox.ValueMember = "Flag2";
		this.flag2ComboBox.SelectionChangeCommitted += new System.EventHandler(flagComboBox_SelectedIndexChanged);
		this.labelItemFlag1LabelItemFlag2BindingSource.DataMember = "LabelItem_Flag1_LabelItem_Flag2";
		this.labelItemFlag1LabelItemFlag2BindingSource.DataSource = this.labelItemFlag1BindingSource;
		this.labelItemFlag1LabelItemFlag2BindingSource.Filter = "[Display] <> '#NULL#'";
		this.flag3ComboBox.DataSource = this.labelItemFlag1LabelItemFlag3BindingSource;
		this.flag3ComboBox.DisplayMember = "Display";
		this.flag3ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.flag3ComboBox.DropDownWidth = 250;
		this.flag3ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.flag3ComboBox, "flag3ComboBox");
		this.flag3ComboBox.Name = "flag3ComboBox";
		this.flag3ComboBox.ValueMember = "Flag3";
		this.labelItemFlag1LabelItemFlag3BindingSource.DataMember = "LabelItem_Flag1_LabelItem_Flag3";
		this.labelItemFlag1LabelItemFlag3BindingSource.DataSource = this.labelItemFlag1BindingSource;
		this.labelItemFlag1LabelItemFlag3BindingSource.Filter = "[Display] <> '#NULL#'";
		this.okButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.okButton, "okButton");
		this.okButton.Name = "okButton";
		this.okButton.UseVisualStyleBackColor = true;
		this.okButton.Click += new System.EventHandler(okButton_Click);
		resources.ApplyResources(this.textBox, "textBox");
		this.textBox.Name = "textBox";
		this.textBox.TextChanged += new System.EventHandler(textBox_TextChanged);
		this.labelItemFlag2LabelItemFlag4BindingSource.DataMember = "LabelItem_Flag2_LabelItem_Flag4";
		this.labelItemFlag2LabelItemFlag4BindingSource.DataSource = this.labelItemFlag1LabelItemFlag2BindingSource;
		this.labelItemFlag2LabelItemFlag4BindingSource.Filter = "[Display] <> '#NULL#'";
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		resources.ApplyResources(this.cancelButton, "cancelButton");
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		base.AcceptButton = this.okButton;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.CancelButton = this.cancelButton;
		base.Controls.Add(this.cancelButton);
		base.Controls.Add(this.flag1ComboBox);
		base.Controls.Add(this.flag2ComboBox);
		base.Controls.Add(this.flag3ComboBox);
		base.Controls.Add(this.textBox);
		base.Controls.Add(this.okButton);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "FlagForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(FlagForm_Load);
		((System.ComponentModel.ISupportInitialize)this.labelItemFlag1BindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemFlag1LabelItemFlag2BindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemFlag1LabelItemFlag3BindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemFlag2LabelItemFlag4BindingSource).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	public FlagForm()
	{
		InitializeComponent();
	}

	private void FlagForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_Name");
		cancelButton.Text = Program.GetLang("pw_Cancel");
		okButton.Text = Program.GetLang("pw_OK");
		Font = Settings.Default.CustomFont;
		string fileName = Application.StartupPath + "\\LabelItem.xml";
		uIDataSet.ReadXml(fileName);
		ECSDataSet ctData = new ECSDataSet();
		BitmapFuc.DataSet_Bitmap_Load_Sim(ref ctData, ref uIDataSet);
		ctData.Dispose();
		UpdateUI(Flag1, Flag2);
		flag1ComboBox.SelectedValue = Flag1;
		flag2ComboBox.SelectedValue = Flag2;
		flag3ComboBox.SelectedValue = Flag3;
	}

	private void okButton_Click(object sender, EventArgs e)
	{
		Flag1 = GetFlag(flag1ComboBox);
		Flag2 = GetFlag(flag2ComboBox);
		Flag3 = GetFlag(flag3ComboBox);
	}

	private static int GetFlag(ComboBox comboBox)
	{
		if (comboBox.SelectedIndex != -1)
		{
			return (int)comboBox.SelectedValue;
		}
		return 0;
	}

	private void flagComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		UpdateUI(GetFlag(flag1ComboBox), GetFlag(flag2ComboBox));
	}

	private void UpdateUI(int flag1, int flag2)
	{
		if (flag1 != 2)
		{
			flag3ComboBox.Visible = flag1 == 0 || flag1 == 1 || flag1 == 5 || flag1 == 7;
		}
		else
		{
			flag3ComboBox.Visible = uIDataSet.LabelItem_Flag4.Select("Flag1 = " + flag1 + " AND Flag2 = " + flag2).Length > 1;
		}
		textBox.Visible = flag1 == 3;
		if (flag1 == 3 && flag2 >= 0 && flag2 < 32)
		{
			textBox.Text = text[flag2];
		}
		if (flag1 == 7 || flag1 == 2)
		{
			flag3ComboBox.DataSource = labelItemFlag2LabelItemFlag4BindingSource;
			flag3ComboBox.ValueMember = "Flag4";
		}
		else
		{
			flag3ComboBox.DataSource = labelItemFlag1LabelItemFlag3BindingSource;
			flag3ComboBox.ValueMember = "Flag3";
		}
	}

	private void textBox_TextChanged(object sender, EventArgs e)
	{
		int selectedIndex = flag1ComboBox.SelectedIndex;
		int selectedIndex2 = flag2ComboBox.SelectedIndex;
		if (selectedIndex == 3 && selectedIndex2 >= 0 && selectedIndex2 < 32)
		{
			text[selectedIndex2] = textBox.Text;
		}
	}
}
