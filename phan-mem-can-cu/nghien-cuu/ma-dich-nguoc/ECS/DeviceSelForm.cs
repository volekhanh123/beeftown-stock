using System;
using System.ComponentModel;
using System.Data;
using System.Windows.Forms;
using ECS.Properties;
using ECS.ReportDataSetTableAdapters;

namespace ECS;

public class DeviceSelForm : Form
{
	private IContainer components;

	private ReportDataSet reportDataSet;

	private BindingSource sGroupBindingSource;

	private ComboBox tableComboBox;

	private Button okButton;

	private Button cancelButton;

	private SGroupTableAdapter sGroupTableAdapter;

	private TextBox Name_TextBox;

	private RadioButton exist_RadioButton;

	private RadioButton new_RadioButton;

	private int firstvalue = 1;

	private bool allowedNew = true;

	private int startvalue;

	public int SG_ID
	{
		get
		{
			if (tableComboBox.SelectedIndex == -1)
			{
				return -1;
			}
			return (int)tableComboBox.SelectedValue;
		}
		set
		{
			tableComboBox.SelectedValue = value;
		}
	}

	public string SG_Name
	{
		get
		{
			return Name_TextBox.Text;
		}
		set
		{
			Name_TextBox.Text = value;
		}
	}

	public bool SG_New
	{
		get
		{
			return new_RadioButton.Checked;
		}
		set
		{
			if (value)
			{
				new_RadioButton.Checked = true;
			}
			else
			{
				exist_RadioButton.Checked = true;
			}
		}
	}

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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.DeviceSelForm));
		this.reportDataSet = new ECS.ReportDataSet();
		this.sGroupBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.tableComboBox = new System.Windows.Forms.ComboBox();
		this.okButton = new System.Windows.Forms.Button();
		this.cancelButton = new System.Windows.Forms.Button();
		this.sGroupTableAdapter = new ECS.ReportDataSetTableAdapters.SGroupTableAdapter();
		this.Name_TextBox = new System.Windows.Forms.TextBox();
		this.exist_RadioButton = new System.Windows.Forms.RadioButton();
		this.new_RadioButton = new System.Windows.Forms.RadioButton();
		((System.ComponentModel.ISupportInitialize)this.reportDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.sGroupBindingSource).BeginInit();
		base.SuspendLayout();
		this.reportDataSet.DataSetName = "ReportDataSet";
		this.reportDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.sGroupBindingSource.DataMember = "SGroup";
		this.sGroupBindingSource.DataSource = this.reportDataSet;
		this.tableComboBox.DataSource = this.sGroupBindingSource;
		this.tableComboBox.DisplayMember = "Name";
		this.tableComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.tableComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.tableComboBox, "tableComboBox");
		this.tableComboBox.Name = "tableComboBox";
		this.tableComboBox.ValueMember = "GID";
		this.tableComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(tableComboBox_Format);
		this.okButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.okButton, "okButton");
		this.okButton.Name = "okButton";
		this.okButton.UseVisualStyleBackColor = true;
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		resources.ApplyResources(this.cancelButton, "cancelButton");
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		this.sGroupTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this.Name_TextBox, "Name_TextBox");
		this.Name_TextBox.Name = "Name_TextBox";
		resources.ApplyResources(this.exist_RadioButton, "exist_RadioButton");
		this.exist_RadioButton.Checked = true;
		this.exist_RadioButton.Name = "exist_RadioButton";
		this.exist_RadioButton.TabStop = true;
		this.exist_RadioButton.UseVisualStyleBackColor = true;
		this.exist_RadioButton.CheckedChanged += new System.EventHandler(exist_RadioButton_CheckedChanged);
		resources.ApplyResources(this.new_RadioButton, "new_RadioButton");
		this.new_RadioButton.Name = "new_RadioButton";
		this.new_RadioButton.UseVisualStyleBackColor = true;
		base.AcceptButton = this.okButton;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.CancelButton = this.cancelButton;
		base.Controls.Add(this.new_RadioButton);
		base.Controls.Add(this.exist_RadioButton);
		base.Controls.Add(this.Name_TextBox);
		base.Controls.Add(this.tableComboBox);
		base.Controls.Add(this.okButton);
		base.Controls.Add(this.cancelButton);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "DeviceSelForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(SelTableForm_Load);
		((System.ComponentModel.ISupportInitialize)this.reportDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.sGroupBindingSource).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	public DeviceSelForm()
	{
		InitializeComponent();
	}

	public DeviceSelForm(int fv)
	{
		firstvalue = fv;
		InitializeComponent();
	}

	public DeviceSelForm(bool an, int sv)
	{
		allowedNew = an;
		startvalue = sv;
		InitializeComponent();
	}

	private void SelTableForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_SelectStockTable");
		cancelButton.Text = Program.GetLang("pw_Cancel");
		okButton.Text = Program.GetLang("pw_OK");
		exist_RadioButton.Text = Program.GetLang("pw_ExistStock");
		new_RadioButton.Text = Program.GetLang("pw_NewStock");
		Font = Settings.Default.CustomFont;
		sGroupTableAdapter.Fill(reportDataSet.SGroup);
		if (firstvalue < 0)
		{
			new_RadioButton.Checked = true;
			exist_RadioButton.Enabled = false;
			tableComboBox.SelectedValue = 1;
		}
		else
		{
			tableComboBox.SelectedValue = firstvalue;
			new_RadioButton.Enabled = allowedNew;
		}
		sGroupBindingSource.Filter = "GID >= " + startvalue;
	}

	private void tableComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["GID"], dataRowView["Name"]);
		}
	}

	private void exist_RadioButton_CheckedChanged(object sender, EventArgs e)
	{
		tableComboBox.Enabled = exist_RadioButton.Checked;
		Name_TextBox.Enabled = new_RadioButton.Checked;
	}
}
